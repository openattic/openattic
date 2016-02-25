
NAGIOS_RESTART_REQ="false"

if grep process_performance_data $NAGIOS_CFG | cut -d= -f2 | grep -q 0; then
	# Enable processing of performance data
	sed -i -e 's/^process_performance_data=0$/process_performance_data=1/' $NAGIOS_CFG
	NAGIOS_RESTART_REQ="true"
fi

# Enable NPCD broker module (except for Nagios 4 - see OP-820 for details)
if ! $NAGIOS_BINARY_NAME -V | grep "^Nagios Core" | cut -d" " -f3 | grep "^4" ; then
  if ! grep broker_module $NAGIOS_CFG | grep -v '#' | grep -q npcdmod.o; then
    echo "broker_module=$NPCD_MOD config_file=$NPCD_CFG" >> $NAGIOS_CFG
    NAGIOS_RESTART_REQ="true"
  fi
fi

if [ -e /etc/default/npcd ] && grep -q 'RUN="no"' /etc/default/npcd; then
	# Enable npcd
	sed -i -e 's/RUN="no"/RUN="yes"/' /etc/default/npcd
fi
service $NPCD_SERVICE start

if [ $NAGIOS_RESTART_REQ = "true" ]; then
	service $NAGIOS_SERVICE restart
  WAITTIME="15"
  echo -n "Waiting for $NAGIOS_STATUS_DAT to appear"
  for i in $(seq 1 $WAITTIME); do
    if [ -e $NAGIOS_STATUS_DAT ]; then
      echo " OK";
      break;
    fi
    sleep 1
    echo -n "."
  done
  if [ ! -e $NAGIOS_STATUS_DAT ]; then
    echo ""
    echo "Error: $NAGIOS_STATUS_DAT did not appear after $WAITTIME seconds!"
    exit 1
  else
    exit 0
  fi
fi
