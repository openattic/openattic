#!/bin/sh
. /home/vagrant/env/bin/activate
echo "# The WebUI is available via:"
for iface in $(ls /sys/class/net/ | grep ^eth); do
	ip_addr="$(LANG=C /sbin/ifconfig ${iface} | egrep -o 'inet addr:[^ ]+' | egrep -o '[0-9.]+')"
	echo "- http://$ip_addr:8000"
done
echo
echo "# Starting webserver..."
python /home/vagrant/openattic/backend/manage.py runserver 0.0.0.0:8000
