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

set -e
set -o xtrace

if grep -q  debian /etc/*-release
then
    IS_DEBIAN="1"
fi

if grep -q suse /etc/*-release
then
    IS_SUSE="1"
fi


if [ "$IS_DEBIAN" ]
then
    export DEBIAN_FRONTEND=noninteractive

    apt-get update -y
    apt-get upgrade -y
fi

if [ "$IS_SUSE" ]
then
    zypper refresh
    # TODO: Disabled cause of Error: Subprocess failed. Error: RPM failed: error: unpacking of archive failed on file /usr/lib64/ruby/gems/2.1.0/cache/json_pure-2.0.1.gem: cpio: chown failed - Operation not permitted
    # zypper --non-interactive up
fi

# Installing Ceph
# http://docs.ceph.com/docs/master/install/get-packages/

if [ "$IS_DEBIAN" ]
then
    apt-get install -y mercurial git build-essential python-dev lsb-release

    wget 'https://download.ceph.com/keys/release.asc'
    apt-key add release.asc

    echo deb http://download.ceph.com/debian-jewel/ $(lsb_release -sc) main | tee /etc/apt/sources.list.d/ceph.list
fi

if [ "$IS_SUSE" ]
then
    zypper ar http://download.opensuse.org/repositories/filesystems:/ceph:/jewel/openSUSE_Leap_42.1/filesystems:ceph:jewel.repo
    zypper --gpg-auto-import-keys --non-interactive ref
    zypper --gpg-auto-import-keys --non-interactive install ceph-common
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
    OA_PACKAGES="$OA_PACKAGES
module-apt"
    toInstall="$(apt-get install -s $(echo -e "$OA_PACKAGES" | xargs -I SUB echo openattic-SUB) | grep 'Inst ' | cut -c 6- | egrep -o '^[.a-zA-Z0-9-]+' | sort |  grep -v -e python -e openattic -e apache)"
    echo $toInstall
    apt-get install -y --force-yes $toInstall

    # System packages not available in pip + npm

    apt-get install -y python-dbus python-virtualenv python-pip python-gobject-2 python-psycopg2 python-rtslib-fb nodejs npm
    apt-get install -y libjpeg-dev # interestingly this is required for openattic-module-nagios

    ln -s /usr/bin/nodejs /usr/bin/node
    ln -s /home/vagrant/openattic/debian/default/openattic /etc/default/openattic
    ln -s /home/vagrant/openattic/etc/nagios-plugins/config/openattic.cfg  /etc/nagios-plugins/config/openattic.cfg
    ln -s /home/vagrant/openattic/etc/nagios3/conf.d/openattic_static.cfg /etc/nagios3/conf.d/openattic_static.cfg
    rm /etc/nagios3/conf.d/localhost_nagios2.cfg # TODO: OP-1066

fi

if [ "$IS_SUSE" ]
then
    OA_PACKAGES="$OA_PACKAGES
module-icinga"
    ZYP_PACKAGES="$(echo -e "$OA_PACKAGES" | xargs -I SUB echo openattic-SUB)"
    DEPS="$(zypper --non-interactive install  --dry-run $ZYP_PACKAGES | grep -A 1 'NEW packages are going to be installed' | tail -n 1)"
    zypper --non-interactive install $(echo $DEPS | tr " " "\n" | grep -v -e openattic -e apache -e python)

    ln -s /home/vagrant/openattic/rpm/sysconfig/openattic.SUSE /etc/sysconfig/openattic
    ln -s /home/vagrant/openattic/etc/nagios3/conf.d/openattic_static.cfg /etc/icinga/conf.d/openattic_static.cfg
    ln -s /home/vagrant/openattic/etc/nagios-plugins/config/openattic.cfg /etc/icinga/objects/openattic.cfg

    # System packages not available in pip + npm

    zypper --non-interactive install -y python-virtualenv python-pip python-gobject2 python-psycopg2 python-rtslib-fb nodejs npm mercurial python-devel zlib-devel libjpeg-devel
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

service dbus restart

npm install -g bower
npm install grunt
npm install -g grunt-cli


sudo -u postgres psql << EOF
alter user postgres password 'postgres';
create user pyfiler createdb createuser password 'pyf!l0r';
create database pyfiler owner pyfiler;
EOF

# Using virtualbox, the log file may not be there at this point, so we have to create it manually.
if [ ! -d "/var/log/openattic" ] ; then
    mkdir "/var/log/openattic"
fi
if [ ! -f "/var/log/openattic/openattic.log" ] ; then
    touch "/var/log/openattic/openattic.log"
fi
chmod 777 "/var/log/openattic/openattic.log"

sudo -i -u vagrant bash -e << EOF

virtualenv env
. env/bin/activate
pip install --upgrade pip
pip install -r openattic/requirements.txt

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
python manage.py syncdb --noinput
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

