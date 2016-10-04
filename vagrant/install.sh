#!/bin/bash
#
#  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
#
#  openATTIC is free software; you can redistribute it and/or modify it
#  under the terms of the GNU General Public License as published by
#  the Free Software Foundation; version 2.
#
#  This package is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.

function usage {
    echo "Usage:"
    echo -e "\t$0 [--disable-ceph-repo]"
    echo -e "\t$0 (-h|--help)"
    echo
    echo "Options:"
    echo
    echo -e "\t--disable-ceph-repo"
    echo
    echo -e "\t\tDisables the adding of the Ceph repo and expects that it's already added when"
    echo -e "\t\tthis script is executed."
}

DISABLE_CEPH_REPO=false
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in

        -h|--help)
            usage
            exit 0
            ;;

        --disable-ceph-repo)
            DISABLE_CEPH_REPO=true
            ;;

        *)
            echo "error: unknown argument"
            usage
            exit 1
            ;;
    esac
    shift
done

set -e
set -o xtrace

if grep -q  debian /etc/*-release
then
    IS_DEBIAN="1"
    if grep -q  ubuntu /etc/*-release
    then
        IS_UBUNTU="1"
    fi
fi

if grep -q suse /etc/*-release
then
    IS_SUSE="1"
fi


if [ "$IS_DEBIAN" ]
then
    export DEBIAN_FRONTEND=noninteractive

    apt-get update -y
    apt-get upgrade -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" --force-yes

    apt-get install -y mercurial git build-essential python-dev lsb-release
fi

if [ "$IS_SUSE" ]
then
    zypper refresh
    # TODO: Disabled cause of Error: Subprocess failed. Error: RPM failed: error: unpacking of archive failed on file /usr/lib64/ruby/gems/2.1.0/cache/json_pure-2.0.1.gem: cpio: chown failed - Operation not permitted
    # zypper --non-interactive up
fi

# Installing Ceph
# http://docs.ceph.com/docs/master/install/get-packages/
if [ "${DISABLE_CEPH_REPO}" == false ] ; then
    if [ "$IS_DEBIAN" ] ; then
        wget 'https://download.ceph.com/keys/release.asc'
        apt-key add release.asc
        echo deb http://download.ceph.com/debian-jewel/ $(lsb_release -sc) main | tee /etc/apt/sources.list.d/ceph.list
    fi

    if [ "$IS_SUSE" ] ; then
        zypper ar http://download.opensuse.org/repositories/filesystems:/ceph:/jewel/openSUSE_Leap_42.1/filesystems:ceph:jewel.repo
        zypper --gpg-auto-import-keys --non-interactive ref
    fi
fi

if [ "$IS_DEBIAN" ] ; then
    apt install -y ceph-common
fi

if [ "$IS_SUSE" ] ; then
    zypper --quiet --gpg-auto-import-keys --non-interactive install ceph-common
fi

# Installing openATTIC
# http://docs.openattic.org/2.0/install_guides/oA_installation.html#installation-on-debian-ubuntu-linux

if [ "$IS_DEBIAN" ]
then
    wget http://apt.openattic.org/A7D3EAFA.txt -q -O - | apt-key add -

    cat << EOF > /etc/apt/sources.list.d/openattic.list
deb     http://apt.openattic.org/ jessie   main
deb-src http://apt.openattic.org/ jessie   main
deb     http://apt.openattic.org/ nightly  main
deb-src http://apt.openattic.org/ nightly  main
EOF

    apt-get update
fi
if [ "$IS_SUSE" ]
then
    zypper addrepo http://download.opensuse.org/repositories/filesystems:openATTIC/openSUSE_Leap_42.1/filesystems:openATTIC.repo
    zypper --gpg-auto-import-keys --non-interactive ref
fi

# Setting up the development environment
# http://docs.openattic.org/2.0/developer_docs/setup_howto.html#installing-the-development-tools
OA_PACKAGES='base
gui
module-btrfs
module-ceph
module-cron
module-http
module-nfs
module-samba
module-lio
pgsql'

if [ "$IS_DEBIAN" ]
then
    if [ "$IS_UBUNTU" ]
    then
        toInstall="$(python << EOF
def agg(state, line):
     isin, deps = state
     if not isin:
         return (True, deps + [line[9:]]) if line.startswith('Depends: ') else (False, deps)
     else:
         return (True, deps + [line[1:]]) if line.startswith(' ') else (False, deps)

deps = reduce(agg, open('/home/vagrant/openattic/debian/control'), (False, []))
deps2 = {d.strip() for d in sum([dep.split(',') for dep in deps[1]], []) if 'python' not in d and 'openattic' not in d and '$' not in d and 'apache' not in d and '|' not in d}
deps3 = [d.split(' ')[0] for d in deps2 if d not in ['tw-cli', 'mail-transport-agent', 'udisks']]
print ' '.join(deps3)
EOF
)"
    else
    OA_PACKAGES="$OA_PACKAGES
module-apt"
    toInstall="$(apt-get install -s $(echo -e "$OA_PACKAGES" | xargs -I SUB echo openattic-SUB) | grep 'Inst ' | cut -c 6- | egrep -o '^[.a-zA-Z0-9-]+' | sort |  grep -v -e python -e openattic -e apache)"
    fi

    echo $toInstall
    apt-get install -y --force-yes $toInstall

    # System packages not available in pip + npm

    apt-get install -y python-dbus python-virtualenv python-pip python-gobject-2 python-psycopg2 python-rtslib-fb nodejs npm
    apt-get install -y libjpeg-dev # TODO this is required for openattic-module-nagios
    if [ "$IS_UBUNTU" ]
    then
        apt-get install -y --force-yes nullmailer # FIXME! Needed for newaliases command
    fi

    ln -s /usr/bin/nodejs /usr/bin/node
    ln -s /home/vagrant/openattic/debian/default/openattic /etc/default/openattic
    ln -s /home/vagrant/openattic/etc/nagios-plugins/config/openattic.cfg  /etc/nagios-plugins/config/openattic.cfg
    ln -s /home/vagrant/openattic/etc/nagios3/conf.d/openattic_static.cfg /etc/nagios3/conf.d/openattic_static.cfg
    if [ ! "$IS_UBUNTU" ]
    then
        rm /etc/nagios3/conf.d/localhost_nagios2.cfg # TODO: OP-1066
    fi

fi

if [ "$IS_SUSE" ]
then
    OA_PACKAGES="$OA_PACKAGES
module-icinga"
    ZYP_PACKAGES="$(echo -e "$OA_PACKAGES" | xargs -I SUB echo openattic-SUB)"
    DEPS="$(zypper --non-interactive install  --dry-run $ZYP_PACKAGES | grep -A 1 'NEW packages are going to be installed' | tail -n 1)"
    zypper --quiet --non-interactive install $(echo $DEPS | tr " " "\n" | grep -v -e openattic -e apache -e python)

    ln -s /home/vagrant/openattic/rpm/sysconfig/openattic.SUSE /etc/sysconfig/openattic
    ln -s /home/vagrant/openattic/etc/nagios3/conf.d/openattic_static.cfg /etc/icinga/conf.d/openattic_static.cfg
    ln -s /home/vagrant/openattic/etc/nagios-plugins/config/openattic.cfg /etc/icinga/objects/openattic.cfg

    # System packages not available in pip + npm

    zypper --quiet --non-interactive install -y python-virtualenv python-pip python-gobject2 python-psycopg2 python-rtslib-fb nodejs npm mercurial python-devel zlib-devel libjpeg-devel
    # python-dbus  python-gobject-2
    #zypper --non-interactive install -y libjpeg-dev # interestingly this is required for openattic-module-nagios
    systemctl restart postgresql.service
    sed -i -e 's/ident$/md5/g' /var/lib/pgsql/data/pg_hba.conf
    systemctl restart postgresql.service

    ln -s /home/vagrant/openattic/etc/tmpfiles.d/openattic.conf /etc/tmpfiles.d/openattic.conf
fi

ln -s /home/vagrant/openattic/etc/openattic /etc/openattic
ln -s /home/vagrant/openattic/etc/dbus-1/system.d/openattic.conf /etc/dbus-1/system.d/openattic.conf

sudo -i -u vagrant bash -e << EOF
pushd openattic
! hg import vagrant/required-changes.patch --no-commit
popd
EOF

service dbus reload

npm install -g bower
npm install grunt
npm install -g grunt-cli


if [ "$IS_UBUNTU" ]
then
sudo -u postgres psql << EOF
alter user postgres password 'postgres';
create user pyfiler createdb createuser password 'pyf!l0r';
create database pyfiler OWNER pyfiler ENCODING 'UTF-8';
EOF
else
sudo -u postgres psql << EOF
alter user postgres password 'postgres';
create user pyfiler createdb createuser password 'pyf!l0r';
create database pyfiler OWNER pyfiler;
EOF
fi

# Using virtualbox, the log file may not be there at this point, so we have to create it manually.
mkdir -p "/var/log/openattic"
touch "/var/log/openattic/openattic.log"
chmod 777 "/var/log/openattic/openattic.log"

sudo -i -u vagrant bash -e << EOF
cat << EOF2 >> /home/vagrant/.bash_history
. env/bin/activate
cd openattic/backend/
EOF2
EOF

sudo IS_UBUNTU="$IS_UBUNTU" -i -u vagrant bash -e << EOF

virtualenv env
. env/bin/activate
pip install --upgrade pip
if [ "$IS_UBUNTU" ]
then
pip install -r openattic/requirements/ubuntu-16.04.txt
else
pip install -r openattic/requirements.txt
fi

# dbus
cp  /usr/lib*/python2.7/*-packages/_dbus* env/lib/python2.7/site-packages/
cp -r /usr/lib*/python2.7/*-packages/dbus env/lib/python2.7/site-packages/

# ceph
cp -r /usr/lib*/python2.7/*-packages/rados* env/lib/python2.7/site-packages/
cp -r /usr/lib*/python2.7/*-packages/rbd*  env/lib/python2.7/site-packages/

# glib
cp -r /usr/lib*/python2.7/*-packages/gobject env/lib/python2.7/site-packages/
cp -r /usr/lib*/python2.7/*-packages/glib env/lib/python2.7/site-packages/

# psycopg2
cp -r /usr/lib*/python2.7/*-packages/psycopg2 env/lib/python2.7/site-packages/

#rtslib
cp -r /usr/lib*/python2.7/*-packages/rtslib env/lib/python2.7/site-packages/

# oaconfig install

pushd openattic/backend/

python manage.py pre_install
python manage.py migrate
python manage.py loaddata nagios/*/initial_data.json
#python manage.py syncdb --noinput
python manage.py createcachetable status_cache
python manage.py add-host

popd
EOF

if [ "$IS_SUSE" ]
then
    # TODO: looks weird, but it's required.
    echo cfg_file=/etc/icinga/objects/openattic.cfg >> /etc/icinga/icinga.cfg
    systemctl start icinga.service
fi


pushd /home/vagrant/openattic/backend/
../../env/bin/python manage.py runsystemd &


popd

sudo -i -u vagrant bash -e << EOF
. env/bin/activate

pushd openattic/backend/

python manage.py makedefaultadmin
python manage.py post_install

popd

pushd openattic/webui

npm install
bower install
grunt build

popd

EOF
ip_addr="$(LANG=C /sbin/ifconfig eth0 | egrep -o 'inet addr:[^ ]+' | egrep -o '[0-9.]+')"
echo -e "# Now run\n. env/bin/activate\npython openattic/backend/manage.py runserver 0.0.0.0:8000\n# and open\nhttp://$ip_addr:8000"

