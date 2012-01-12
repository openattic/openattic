#!/bin/bash

### BEGIN INIT INFO
# Provides: openattic-systemd
# Required-Start: $local_fs $network $remote_fs
# Required-Stop: $local_fs $network $remote_fs
# Default-Start:  2 3 4 5
# Default-Stop: 0 1 6
# Short-Description: openATTIC's system configuration daemon
# Description: handles communication with the various system tools
### END INIT INFO


set -e
set -u

. /etc/default/openattic

if [ $# -lt 1 ]
then
	echo "$0 <start|stop|restart|status>"
	exit 1
fi

. /lib/lsb/init-functions

case $1 in
	start)
		log_daemon_msg "Starting" "openATTIC systemd"
		start-stop-daemon --pidfile=$SYSD_PIDFILE --make-pidfile --background --oknodo --start \
			--exec $PYTHON --chdir $OADIR -- $SYSD_OPTIONS -l $SYSD_LOGFILE -L $SYSD_LOGLEVEL -q
		log_end_msg 0
		;;
	
	stop)
		log_daemon_msg "Stopping" "openATTIC systemd"
		start-stop-daemon --pidfile=$SYSD_PIDFILE --stop --oknodo --exec $PYTHON
		log_end_msg 0
		;;
	
	restart|reload)
		$0 stop
		$0 start
		;;
	
	status)
		if start-stop-daemon --pidfile=$SYSD_PIDFILE --test --stop --exec $PYTHON --quiet
		then
			PID=`cat $SYSD_PIDFILE`
			echo "systemd is running (pid $PID)."
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

