# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2015, it-novum GmbH <community@openattic.org>
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""

import logging

from rtslib          import target

from ifconfig.models import Host
from systemd         import dbus_to_python
from systemd.plugins import logged, BasePlugin, method, deferredmethod
from systemd.lockutils import Lockfile
from systemd.procutils import invoke

from lio             import models


@logged
class SystemD(BasePlugin):
    dbus_path = "/lio"

    @deferredmethod(in_signature="")
    def modprobe(self, sender):
        invoke(["modprobe", "target_core_mod"]),
        invoke(["modprobe", "iscsi_target_mod"])
        invoke(["modprobe", "target_core_iblock"])
        invoke(["modprobe", "target_core_pscsi"])

    @deferredmethod(in_signature="i")
    def install_hostacl(self, id, sender):
        hostacl = models.HostACL.objects.get(id=id)
        models.ProtocolHandler.install_hostacl(hostacl)

    @deferredmethod(in_signature="i")
    def uninstall_hostacl(self, id, sender):
        hostacl = models.HostACL.objects.get(id=id)
        models.ProtocolHandler.uninstall_hostacl(hostacl)

    @deferredmethod(in_signature="")
    def saveconfig(self, sender):
        # acquire a lock file to prevent race conditions in the save_config methods.
        with Lockfile("/var/lock/openattic/lio_saveconfig"):
            # LIO is a pretty fast moving target currently, especially when it comes to saving the
            # config. We want to deal with this situation without having to hardcode Distro versions,
            # so we'll just have to try all the known ways and see which one works here.

            # this works at least on Debian <= Wheezy and Ubuntu <= 14.04
            # ripped from /usr/share/pyshared/targetcli/ui_root.py (ui_command_saveconfig function)
            try:
                from tcm_dump import tcm_full_backup
                tcm_full_backup(None, None, '1', None)
                return
            except ImportError:
                logging.warn("tcm_full_backup is unavailable.")

            # the following works for CentOS 7, but will not work anymore for Debian sid and jessie
            try:
                from rtslib.root import RTSRoot
                root = RTSRoot()
                root.save_to_file()
                return
            except AttributeError:
                logging.warn("RTSRoot.save_to_file is unavailable.")

            # still no luck, let's try the Debian sid way
            try:
                from targetcli.cli_config import CliConfig
                CliConfig.save_running_config()
                return
            except (ImportError, AttributeError):
                logging.warn("CliConfig.save_running_config is unavailable.")

            # now, being a smartass and trying to invoke(["targetcli"], stdin="cd /\nsaveconfig\nyes\n")
            # would just lead to targetcli complaining about the following:
            #
            # Traceback (most recent call last):
            #   File "/usr/bin/targetcli", line 89, in <module>
            #     main()
            #   File "/usr/bin/targetcli", line 82, in main
            #     shell.run_interactive()
            #   File "/usr/lib/python2.7/site-packages/configshell/shell.py", line 955, in run_interactive
            #     readline.set_completer(old_completer)
            # NameError: global name 'readline' is not defined
            #
            # So, this won't work.

            raise SystemError(
                "Config cannot be saved because none of the ways we know of are available on your system. "
                "This is likely a bug. Please contact the openATTIC team at http://open-attic.org.")

