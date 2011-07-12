#!/bin/bash

### BEGIN INIT INFO
# Provides: openattic-rpcd
# Required-Start: $local_fs $network $remote_fs openattic-systemd
# Required-Stop: $local_fs $network $remote_fs
# Default-Start:  2 3 4 5
# Default-Stop: 0 1 6
# Short-Description: openATTIC's XMLRPC interface daemon
# Description: handles communication with other hosts
### END INIT INFO


set -e
set -u

PIDFILE="/var/run/openattic_rpcd.pid"
CHUID="www-data:www-data"
LOGFILE="/var/log/openattic_rpcd"
LOGLEVEL="DEBUG"
PYTHON="/usr/bin/python"
OADIR="/srv/pyfiler"
OPTIONS="$OADIR/manage.py runrpcd"
CERTFILE="$OADIR/certs/ssl-cert-snakeoil.pem"
KEYFILE="$OADIR/certs/ssl-cert-snakeoil.key"

if [ $# -lt 1 ]
then
	echo "$0 <start|stop|restart|status>"
	exit 1
fi

. /lib/lsb/init-functions

case $1 in
	start)
		log_daemon_msg "Starting" "openATTIC rpcd"
		if [ ! -z "$CERTFILE" -a ! -z "$KEYFILE" ]; then
			OPTIONS="$OPTIONS -c $CERTFILE -k $KEYFILE"
		fi
		start-stop-daemon --pidfile=$PIDFILE --make-pidfile --background --oknodo --start \
			--exec $PYTHON --chdir $OADIR --chuid $CHUID -- $OPTIONS -l $LOGFILE -L $LOGLEVEL -q
		log_end_msg 0
		;;
	
	stop)
		log_daemon_msg "Stopping" "openATTIC rpcd"
		start-stop-daemon --pidfile=$PIDFILE --stop --exec $PYTHON
		log_end_msg 0
		;;
	
	restart|reload)
		$0 stop
		$0 start
		;;
	
	status)
		if start-stop-daemon --pidfile=$PIDFILE --test --stop --exec $PYTHON --quiet
		then
			echo "systemd is running"
			exit 0
		else
			echo "systemd is not running"
			exit 3
		fi
		;;
	
	probe)
		echo restart
		exit 0
		;;
	
	*)
		echo "Unknown command $1."
		exit 1
		;;
esac

