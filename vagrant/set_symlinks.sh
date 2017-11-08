#!/bin/bash

# TODO: merge with install.sh!
# There are subtle differences between the vagrant setup and this set_symlinks.sh:
# 1. In a vagrant setup, oaconfig doesn't work at all.
# 2. /etc/dbus-1/system.d/openattic.conf is not a symlink but a file with some different content.
# Therefore, I didn't merged both files at the moment.
# Nevertheless, this script should still work for the classic development environment and the CI.

set -eu

if grep -q  debian /etc/*-release; then
    IS_DEBIAN="1"
    IS_SUSE=""
elif grep -q suse /etc/*-release; then
    IS_SUSE="1"
    IS_DEBIAN=""
fi

OADIR="$(dirname "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)")"

rm -rf /usr/share/openattic
ln -s $OADIR/backend /usr/share/openattic
rm -rf /usr/share/openattic-gui
ln -s $OADIR/webui/app /usr/share/openattic-gui

# Not needed anymore.
# ln -fs $OADIR/backend/settings.py /etc/openattic/settings.py

ln -sf $OADIR/bin/oaconfig /usr/sbin/oaconfig

rm -f /etc/dbus-1/system.d/openattic.conf #if it was a symlink before
cp -f $OADIR/etc/dbus-1/system.d/openattic.conf /etc/dbus-1/system.d/openattic.conf


if [ "$IS_DEBIAN" ]; then
    ln -sf $OADIR/debian/default/openattic /etc/default/openattic
fi

if [ "$IS_SUSE" ]; then
    ln -sf $OADIR/rpm/sysconfig/openattic.SUSE /etc/sysconfig/openattic
fi
