
NAGIOS_RESTART_REQ="false"

if grep process_performance_data $NAGIOS_CFG | cut -d= -f2 | grep -q 0; then
	# Enable processing of performance data
	sed -i -e 's/^process_performance_data=0$/process_performance_data=1/' $NAGIOS_CFG
	NAGIOS_RESTART_REQ="true"
fi

# Enable NPCD broker module
if ! grep broker_module $NAGIOS_CFG | grep -v '#' | grep -q npcdmod.o; then
	echo "broker_module=$NPCD_MOD config_file=$NPCD_CFG" >> $NAGIOS_CFG
	NAGIOS_RESTART_REQ="true"
fi

if [ -e /etc/default/npcd ] && grep -q 'RUN="no"' /etc/default/npcd; then
	# Enable npcd
	sed -i -e 's/RUN="no"/RUN="yes"/' /etc/default/npcd
fi
service $NPCD_SERVICE start

if [ $NAGIOS_RESTART_REQ = "true" ]; then
	service $NAGIOS_SERVICE restart
	echo -n "Waiting for status.dat to appear... "
	while [ ! -e $NAGIOS_STATUS_DAT ]; do
		sleep 0.1
	done
	echo "done."
fi
