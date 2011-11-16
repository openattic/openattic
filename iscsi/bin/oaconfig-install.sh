if grep -q 'ISCSITARGET_ENABLE=false' /etc/default/iscsitarget; then
	# Enable IETd
	sed -i -e 's/ISCSITARGET_ENABLE=false/ISCSITARGET_ENABLE=true/' /etc/default/iscsitarget
	invoke-rc.d iscsitarget start
fi
