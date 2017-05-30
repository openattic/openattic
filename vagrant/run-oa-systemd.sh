#!/bin/sh
. /home/vagrant/env/bin/activate
which systemctl && sudo systemctl reload dbus || sudo service dbus reload
sudo /home/vagrant/env/bin/python /home/vagrant/openattic/backend/manage.py runsystemd
