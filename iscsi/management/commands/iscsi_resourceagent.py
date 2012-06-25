# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
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

import dbus

from optparse import make_option

from django.conf import settings
from django.core.management.base import BaseCommand

from systemd.helpers import dbus_to_python
from iscsi.models import Target, Lun

class Command( BaseCommand ):
    help = "Pacemaker Resource Agent that configures Targets and Luns."

    option_list = BaseCommand.option_list + (
        make_option( "-a", "--action",
            help="start, stop",
            default=None
            ),
    )

    def handle(self, **options):
        _iscsi = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/iscsi")

        if options["action"] == "start":
            for tgt in Target.objects.all():
                if tgt.tid is not None:
                    print "Target '%s' is already online." % tgt.name
                    continue
                _iscsi.target_new(0, tgt.iscsiname)
                for lun in tgt.lun_set.all():
                    if not lun.volume.standby:
                        lun.iet_add()
                print "Target '%s' activated." % tgt.name

        elif options["action"] == "stop":
            # Kill all connections.
            while True:
                sessions = dbus_to_python(_iscsi.get_sessions())
                foundsession = False
                for iscsiname in sessions:
                    tid = sessions[iscsiname][0]
                    if sessions[iscsiname][1]:
                        foundsession = True
                        for sessdata in sessions[iscsiname][1].values():
                            for cid in sessdata[1]:
                                print "Killing connection %s:%s..." %(sessdata[0], cid)
                                _iscsi.conn_delete(tid, sessdata[0], cid)
                if not foundsession:
                    print "No more sessions open, deactivating targets."
                    break

            for tgt in Target.objects.all():
                if tgt.tid is None:
                    print "Target '%s' is already offline." % tgt.name
                    continue
                while True:
                    # Some sessions take a while to die, rekill targets until they finally do.
                    try:
                        _iscsi.target_delete(tgt.tid)
                    except dbus.exceptions.DBusException:
                        pass
                    else:
                        break
                print "Target '%s' deactivated." % tgt.name

        else:
            print "Unknown action '%s'" % options["action"]
