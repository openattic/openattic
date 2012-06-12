if ! grep -q 'Include /etc/proftpd/conf.d/' /etc/proftpd/proftpd.conf; then
	echo 'Include /etc/proftpd/conf.d/' >> /etc/proftpd/proftpd.conf
	invoke-rc.d proftpd restart
fi
