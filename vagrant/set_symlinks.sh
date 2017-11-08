#!/bin/bash

set -e
set -u

if grep -q  debian /etc/*-release; then
    IS_DEBIAN="1"
    IS_SUSE=""
elif grep -q suse /etc/*-release; then
    IS_SUSE="1"
    IS_DEBIAN=""
fi

oadir=/srv/openattic

rm -rf /usr/share/openattic
ln -s $oadir/backend /usr/share/openattic
ln -fs $oadir/backend/settings.py /etc/openattic/settings.py

rm -rf /usr/share/openattic-gui
ln -s $oadir/webui/app /usr/share/openattic-gui

ln -sf $oadir/bin/oaconfig /usr/sbin/oaconfig

rm -f /etc/dbus-1/system.d/openattic.conf #if it was a symlink before
cp -f $oadir/etc/dbus-1/system.d/openattic.conf /etc/dbus-1/system.d/openattic.conf

rm -rf /etc/sysconfig/openattic

if [ "$IS_DEBIAN" ]; then
    ln -sf $oadir/debian/default/openattic                      /etc/default/openattic
fi
 
if [ "$IS_SUSE" ]; then
    #TODO test symlinks for suse
    cp $oadir/rpm/sysconfig/openattic.SUSE                  /etc/sysconfig/openattic
fi
