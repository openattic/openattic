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

toInstall="$(apt-get install -s $(echo -e 'base\ngui\nmodule-apt\nmodule-btrfs\nmodule-ceph\nmodule-cron\nmodule-http\nmodule-nfs\nmodule-samba\npgsql' | xargs -I SUB echo openattic-SUB) | grep 'Inst ' | cut -c 6- | egrep -o '^[.a-zA-Z0-9-]+' | sort |  grep -v -e python -e openattic -e apache)"
echo $toInstall
apt-get install -y --force-yes $toInstall

# System packages not available in pip

apt-get install -y python-dbus python-virtualenv python-pip python-gobject-2 python-psycopg2

ln -s /home/vagrant/openattic/etc/openattic /etc/openattic

sudo -u postgres psql << EOF
alter user postgres password 'postgres';
create user pyfiler createdb createuser password 'pyf!l0r';
create database pyfiler owner pyfiler;
EOF

sudo -i -u vagrant bash -e << EOF
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

# oaconfig install

pushd openattic/backend/

cat << 'EOF2' > initial_data.json
{
  "fields": {
    "username": "openattic",
    "first_name": "",
    "last_name": "",
    "is_active": true,
    "is_superuser": true,
    "is_staff": true,
    "last_login": "2016-07-14T10:04:49.818",
    "groups": [],
    "user_permissions": [],
    "password": "pbkdf2_sha256$15000$7hAx73SJTK7o$vf39Q7e6hzhSWRPC+AZ73TolMjPUelP31Iiuh0O7m9s=",
    "email": "root@localhost",
    "date_joined": "2016-06-02T15:12:04.670"
  },
  "model": "auth.user",
  "pk": 1
}
EOF2

python manage.py pre_install
python manage.py syncdb
python manage.py createcachetable status_cache
python manage.py add-host

popd

EOF

