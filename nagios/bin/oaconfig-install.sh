
NAGIOS_RESTART_REQ="false"
NAGIOS_CONF="/etc/nagios3/nagios.cfg"

if grep process_performance_data $NAGIOS_CONF | cut -d= -f2 | grep -q 0; then
	# Enable processing of performance data
	sed -i -e 's/^process_performance_data=0$/process_performance_data=1/' $NAGIOS_CONF
	NAGIOS_RESTART_REQ="true"
fi

# Enable NPCD broker module
if ! grep broker_module $NAGIOS_CONF | grep -v '#' | grep -q npcdmod.o; then
	echo "broker_module=/usr/lib/pnp4nagios/npcdmod.o config_file=/etc/pnp4nagios/npcd.cfg" >> $NAGIOS_CONF
	NAGIOS_RESTART_REQ="true"
fi

if grep -q 'RUN="no"' /etc/default/npcd; then
	# Enable npcd
	sed -i -e 's/RUN="no"/RUN="yes"/' /etc/default/npcd
	invoke-rc.d npcd start
fi

if [ $NAGIOS_RESTART_REQ = "true" ]; then
	invoke-rc.d nagios3 restart
	echo -n "Waiting for status.dat to appear... "
	while [ ! -e /var/cache/nagios3/status.dat ]; do
		sleep 0.1
	done
	echo "done."
fi
