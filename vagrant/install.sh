#!/usr/bin/env bash

set -e

export DEBIAN_FRONTEND=noninteractive


apt-get update -y
apt-get upgrade -y


# http://docs.ceph.com/docs/master/install/get-packages/

apt-get install -y mercurial git build-essential python-dev lsb-release

wget 'https://download.ceph.com/keys/release.asc'
apt-key add release.asc

echo deb http://download.ceph.com/debian-jewel/ $(lsb_release -sc) main | tee /etc/apt/sources.list.d/ceph.list

# http://docs.openattic.org/2.0/install_guides/oA_installation.html#installation-on-debian-ubuntu-linux

wget http://apt.openattic.org/A7D3EAFA.txt -q -O - | apt-key add -

cat << EOF > /etc/apt/sources.list.d/openattic.list
deb     http://apt.openattic.org/ jessie   main
deb-src http://apt.openattic.org/ jessie   main
deb     http://apt.openattic.org/ nightly  main
deb-src http://apt.openattic.org/ nightly  main
EOF

apt-get update

# https://docs.it-novum.com/display/OA/PyCharm
# http://docs.openattic.org/2.0/developer_docs/setup_howto.html#installing-the-development-tools

toInstall="$(apt-get install -s $(echo -e 'base\ngui\nmodule-apt\nmodule-btrfs\nmodule-ceph\nmodule-cron\nmodule-http\nmodule-nfs\nmodule-samba\nmodule-lio\npgsql' | xargs -I SUB echo openattic-SUB) | grep 'Inst ' | cut -c 6- | egrep -o '^[.a-zA-Z0-9-]+' | sort |  grep -v -e python -e openattic -e apache)"
echo $toInstall
apt-get install -y --force-yes $toInstall

# System packages not available in pip + npm

apt-get install -y python-dbus python-virtualenv python-pip python-gobject-2 python-psycopg2 python-rtslib-fb nodejs npm
apt-get install -y libjpeg-dev # interestingly this is required for openattic-module-nagios

ln -s /usr/bin/nodejs /usr/bin/node

ln -s /home/vagrant/openattic/etc/openattic /etc/openattic
ln -s /home/vagrant/openattic/debian/default/openattic /etc/default/openattic
ln -s /home/vagrant/openattic/etc/dbus-1/system.d/openattic.conf /etc/dbus-1/system.d/openattic.conf
ln -s /home/vagrant/openattic/etc/nagios-plugins/config/openattic.cfg  /etc/nagios-plugins/config/openattic.cfg
ln -s /home/vagrant/openattic/etc/nagios3/conf.d/openattic_static.cfg /etc/nagios3/conf.d/openattic_static.cfg
rm /etc/nagios3/conf.d/localhost_nagios2.cfg # TODO: OP-1066

service dbus restart

npm install -g bower
npm install grunt
npm install -g grunt-cli


sudo -u postgres psql << EOF
alter user postgres password 'postgres';
create user pyfiler createdb createuser password 'pyf!l0r';
create database pyfiler owner pyfiler;
EOF
sudo -i -u vagrant bash -e << EOF
pushd openattic

hg import vagrant/required-changes.patch --no-commit

popd

virtualenv env
. env/bin/activate
pip install -r openattic/requirements.txt

# dbus
cp  /usr/lib/python2.7/dist-packages/_dbus* env/lib/python2.7/site-packages/
cp -r /usr/lib/python2.7/dist-packages/dbus env/lib/python2.7/site-packages/

# ceph
cp -r /usr/lib/python2.7/dist-packages/rados* env/lib/python2.7/site-packages/
cp -r /usr/lib/python2.7/dist-packages/rbd*  env/lib/python2.7/site-packages/

# glib
cp -r /usr/lib/python2.7/dist-packages/gobject env/lib/python2.7/site-packages/
cp -r /usr/lib/python2.7/dist-packages/glib env/lib/python2.7/site-packages/

# psycopg2
cp -r /usr/lib/python2.7/dist-packages/psycopg2 env/lib/python2.7/site-packages/

#rtslib
cp -r /usr/lib/python2.7/dist-packages/rtslib env/lib/python2.7/site-packages/

# oaconfig install

pushd openattic/backend/

python manage.py pre_install
python manage.py syncdb --noinput
python manage.py createcachetable status_cache
python manage.py add-host

popd
EOF

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

