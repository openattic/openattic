if [ -e "/etc/proftpd/proftpd.conf" -a -e "/etc/proftpd/conf.d" ]; then
	if ! grep -q 'Include /etc/proftpd/conf.d/' /etc/proftpd/proftpd.conf; then
		echo 'Include /etc/proftpd/conf.d/' >> /etc/proftpd/proftpd.conf
		service proftpd restart
	fi
fi
service proftpd status || service proftpd start
