# -*- coding: utf-8 -*-

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

from django.contrib.contenttypes.models import ContentType
from django.db.models import signals

from systemd import get_dbus_object
from nagios.conf import settings as nagios_settings
from ifconfig.models import Host

import sysutils.models
from nagios.models import Service, Command, update_conf


def create_nagios(**kwargs):
    # Make sure the contacts config exists
    signals.post_save.disconnect(update_conf, sender=Service)

    nagios = get_dbus_object("/nagios")

    for servstate in Service.nagstate["servicestatus"]:
        if servstate["service_description"].startswith("Check Ceph") or \
           servstate['service_description'] == 'openATTIC RPCd':
            continue

        cmdargs = servstate["check_command"].split('!')
        cmdname = cmdargs[0]
        cmdargs = cmdargs[1:]

        try:
            cmd = Command.objects.get(name=cmdname)
        except Command.DoesNotExist:
            # Commands that don't exist have not been configured by us, so query_only
            print "Adding Check Command %s" % cmdname
            cmd = Command(name=cmdname, query_only=True)
            cmd.save()

        if not cmd.query_only:
            continue

        try:
            serv = Service.objects.get(
                host=Host.objects.get_current(),
                description=servstate["service_description"],
                command=cmd
                )
        except Service.DoesNotExist:
            print "Adding Service '%s'" % servstate["service_description"]
            serv = Service(host=Host.objects.get_current(),
                           description=servstate["service_description"], command=cmd,
                           arguments=('!'.join(cmdargs)))
            serv.save()

    nagios.writeconf()
    nagios.restart_service()

    update_conf()
    signals.post_save.connect(update_conf, sender=Service)

sysutils.models.post_install.connect(create_nagios)
