#!/bin/sh
. /home/vagrant/env/bin/activate
which systemctl && sudo systemctl reload dbus || sudo service dbus reload
# Change to the directory, otherwise 'settings_local.conf' won't be loaded.
cd /home/vagrant/openattic/backend
sudo /home/vagrant/env/bin/python manage.py runsystemd
