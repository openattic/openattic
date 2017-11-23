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
        if grep -q Trusty /etc/os-release
        then
            IS_TRUSTY="1"
        else
            IS_XENIAL="1"
        fi
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
    apt-get install -y git build-essential python-dev lsb-release
fi

if [ "$IS_SUSE" ]
then
    zypper refresh
    zypper --non-interactive up
fi

# Create the system user and group 'openattic'.
if ! getent passwd openattic ; then
	groupadd --system openattic
	useradd --system --gid openattic --home /var/lib/openattic --shell /bin/bash \
	    --create-home --comment "openATTIC system user" openattic
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
        if ! zypper repos filesystems_ceph_luminous >/dev/null; then
            zypper ar http://download.opensuse.org/repositories/filesystems:/ceph:/luminous/openSUSE_Leap_42.3/filesystems:ceph:luminous.repo
            zypper --gpg-auto-import-keys --non-interactive ref
        fi
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

if [ "$IS_TRUSTY" ]
then
    # http://docs.openattic.org/2.0/install_guides/oA_installation.html#package-installation
    apt-get install -y linux-image-extra-$(uname -r)
fi

if [ "$IS_DEBIAN" ]
then
    wget http://apt.openattic.org/A7D3EAFA.txt -q -O - | apt-key add -
    distro="jessie"
    if [ "$IS_TRUSTY" ]
    then
        distro="trusty"
    fi

    cat << EOF > /etc/apt/sources.list.d/openattic.list
deb     http://apt.openattic.org/ $distro   main
deb-src http://apt.openattic.org/ $distro   main
deb     http://apt.openattic.org/ nightly  main
deb-src http://apt.openattic.org/ nightly  main
EOF

    apt-get update
fi
if [ "$IS_SUSE" ]
then
    if ! zypper repos filesystems_openATTIC >/dev/null; then
        zypper ar http://download.opensuse.org/repositories/filesystems:/openATTIC:/3.x/openSUSE_Leap_42.3/filesystems:openATTIC:3.x.repo
        zypper --gpg-auto-import-keys --non-interactive ref
    fi
fi

# Setting up the development environment
# http://docs.openattic.org/2.0/developer_docs/setup_howto.html#installing-the-development-tools
OA_PACKAGES='base
gui
module-ceph
pgsql'

if [ "$IS_DEBIAN" ]
then
    if [ "$IS_XENIAL" ]
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
deps3 = [d.split(' ')[0] for d in deps2 if d not in ['deepsea']]
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

    apt-get install -y python-dbus python-virtualenv python-pip python-gobject-2 python-psycopg2 python-m2crypto nodejs npm

    ln -s /usr/bin/nodejs /usr/bin/node
    ln -s /home/vagrant/openattic/debian/default/openattic /etc/default/openattic
    if [ "$IS_TRUSTY" ]
    then
        # http://docs.openattic.org/2.0/install_guides/oA_installation.html#package-installation
        service target restart
    fi
fi

if [ "$IS_SUSE" ]
then
    ZYP_PACKAGES="$(echo -e "$OA_PACKAGES" | xargs -I SUB echo openattic-SUB)"
    ! DEPS="$(LANG=C zypper --non-interactive install --dry-run $ZYP_PACKAGES | grep -A 1 'NEW packages are going to be installed' | tail -n 1 | tr " " "\n" | grep -v -e openattic -e apache -e python)"
    if [ -n "$DEPS" ] ; then
        zypper --non-interactive install $DEPS
    fi

    ln -s /home/vagrant/openattic/rpm/sysconfig/openattic.SUSE /etc/sysconfig/openattic

    # System packages not available in pip + npm
    zypper --non-interactive install -y python-virtualenv python-pip python-gobject2 python-psycopg2 nodejs npm python-devel zlib-devel libjpeg-devel
    # python-dbus python-gobject-2
    systemctl restart postgresql.service
    sed -i -e 's/ident$/md5/g' /var/lib/pgsql/data/pg_hba.conf
    systemctl restart postgresql.service
    systemctl enable postgresql.service
fi

ln -s /home/vagrant/openattic/etc/openattic /etc/openattic

# Create/modify the local settings files.
pushd /home/vagrant/openattic
if [ ! -e "backend/settings_local.conf" ]; then
    touch backend/settings_local.conf
    cat <<EOF > backend/settings_local.conf
API_ROOT=":8000/api"
API_OS_USER="vagrant"
LOGGING_FILENAME="/dev/stdout"
EOF
fi
if [ ! -e "webui/app/config.local.js" ]; then
    cp webui/app/config.local.js.sample webui/app/config.local.js
    sed -i -e 's#/openattic/api/#/api/#' webui/app/config.local.js
fi
if [ ! -e "webui/webpack.config.json" ]; then
    cat <<EOF > webui/webpack.config.json
{
  "contextRoot": "/"
}
EOF
fi
popd

# Create the DBUS configuration.
cat <<EOF > /etc/dbus-1/system.d/openattic.conf
<!DOCTYPE busconfig PUBLIC
    "-//freedesktop//DTD D-BUS Bus Configuration 1.0//EN"
    "http://www.freedesktop.org/standards/dbus/1.0/busconfig.dtd">
<busconfig>
    <policy user="root">
            <allow own="org.openattic.systemd" />
            <allow send_destination="org.openattic.systemd" />
            <allow receive_sender="org.openattic.systemd"   />
    </policy>
    <policy user="vagrant">
            <allow send_destination="org.openattic.systemd" />
            <allow receive_sender="org.openattic.systemd"   />
    </policy>
    <policy context="default">
            <deny  send_destination="org.openattic.systemd" />
            <deny  receive_sender="org.openattic.systemd"   />
    </policy>
</busconfig>
EOF

service dbus reload

if [ "$IS_XENIAL" ]
then
sudo -u postgres psql << EOF
alter user postgres password 'postgres';
create user openattic createdb createrole password 'DB_PASSWORD';
create database openattic OWNER openattic ENCODING 'UTF-8';
EOF
else
sudo -u postgres psql << EOF
alter user postgres password 'postgres';
create user openattic createdb createrole password 'DB_PASSWORD';
create database openattic OWNER openattic;
EOF
fi

# echo "drop database openattic;" | sudo -u postgres psql
# echo "create database openattic OWNER openattic;" | sudo -u postgres psql


# Using virtualbox, the log file may not be there at this point, so we have to create it manually.
mkdir -p "/var/log/openattic"
touch "/var/log/openattic/openattic.log"
chmod 777 "/var/log/openattic/openattic.log"

sudo -i -u vagrant bash -e << EOF
cat << EOF2 >> /home/vagrant/.bash_history
sudo systemctl reload dbus
. env/bin/activate
cd openattic/backend/
sudo systemctl reload dbus
EOF2
EOF

pip install --upgrade pip

sudo -i -u vagrant bash -e << EOF

virtualenv env
. env/bin/activate
if [ "$IS_XENIAL" ]
then
pip install -r openattic/requirements/ubuntu-16.04.txt
else
pip install -r openattic/requirements/default.txt
fi

# dbus
cp  /usr/lib*/python2.7/*-packages/_dbus* env/lib/python2.7/site-packages/
cp -r /usr/lib*/python2.7/*-packages/dbus env/lib/python2.7/site-packages/

# ceph
cp -r /usr/lib*/python2.7/*-packages/rados* env/lib/python2.7/site-packages/
cp -r /usr/lib*/python2.7/*-packages/rbd*  env/lib/python2.7/site-packages/
cp -r /usr/lib*/python2.7/*-packages/cephfs*  env/lib/python2.7/site-packages/

# glib
cp -r /usr/lib*/python2.7/*-packages/gobject env/lib/python2.7/site-packages/
cp -r /usr/lib*/python2.7/*-packages/glib env/lib/python2.7/site-packages/

# psycopg2
cp -r /usr/lib*/python2.7/*-packages/psycopg2 env/lib/python2.7/site-packages/

# oaconfig install

pushd openattic/backend/

# Cleanup existing *.pyc files which might cause unexpected problems (e.g. when
# switching between branches).
find * -name '*.pyc' | xargs rm


popd
EOF


pushd /home/vagrant/openattic/backend/
../../env/bin/python manage.py install --pre-install
../../env/bin/python manage.py runsystemd &


popd

sudo -i -u vagrant bash -e << EOF
. env/bin/activate

pushd openattic/backend/

python manage.py install --post-install

popd

pushd openattic/webui

npm install

popd

EOF

echo -e "# Now run\n. openattic/vagrant/run-oa-ui.sh"
