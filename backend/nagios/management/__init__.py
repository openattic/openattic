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

from django.core.management import call_command
from django.contrib.contenttypes.models import ContentType
from django.db.models import signals

from systemd import get_dbus_object
from nagios.conf import settings as nagios_settings
from ifconfig.models import Host, IPAddress
from volumes.models import BlockVolume, FileSystemVolume

import nagios.models
import sysutils.models
from nagios.models    import Service, Command, update_conf

def create_nagios(**kwargs):
    # Make sure the contacts config exists
    signals.post_save.disconnect(update_conf, sender=Service)

    for servstate in Service.nagstate["servicestatus"]:
        cmdargs = servstate["check_command"].split('!')
        cmdname = cmdargs[0]
        cmdargs = cmdargs[1:]

        try:
            cmd = Command.objects.get( name=cmdname )
        except Command.DoesNotExist:
            # Commands that don't exist have not been configured by us, so query_only
            print "Adding Check Command %s" % cmdname
            cmd = Command( name=cmdname, query_only=True )
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
            serv = Service(
                host        = Host.objects.get_current(),
                description = servstate["service_description"],
                command     = cmd,
                arguments   = ('!'.join(cmdargs))
                )
            serv.save()

    cmd = Command.objects.get(name=nagios_settings.CPUTIME_CHECK_CMD)
    if Service.objects.filter(host=Host.objects.get_current(), command=cmd).count() == 0:
        serv = Service(
            host        = Host.objects.get_current(),
            command     = cmd,
            description = nagios_settings.CPUTIME_DESCRIPTION,
            arguments   = ""
            )
        serv.save()

    get_dbus_object("/nagios").writeconf()

    cmd = Command.objects.get(name=nagios_settings.LV_PERF_CHECK_CMD)
    for bv in BlockVolume.objects.all():
        instance = bv.volume
        ctype = ContentType.objects.get_for_model(instance.__class__)
        if Service.objects.filter(command=cmd, target_type=ctype, target_id=instance.id).count() != 0:
            continue
        srv = Service(
            host        = instance.host,
            target      = instance,
            command     = cmd,
            description = nagios_settings.LV_PERF_DESCRIPTION % unicode(instance),
            arguments   = instance.path
        )
        srv.save()

    cmd = Command.objects.get(name=nagios_settings.LV_UTIL_CHECK_CMD)
    for fsv in FileSystemVolume.objects.all():
        instance = fsv.volume
        ctype = ContentType.objects.get_for_model(instance.__class__)
        print type(instance), instance, instance.id
        if Service.objects.filter(command=cmd, target_type=ctype, target_id=instance.id).count() != 0:
            continue
        srv = Service(
            host        = instance.host,
            target      = instance,
            command     = cmd,
            description = nagios_settings.LV_UTIL_DESCRIPTION % unicode(instance),
            arguments   = instance.storageobj.uuid
        )
        srv.save()

    update_conf()
    signals.post_save.connect(update_conf, sender=Service)


sysutils.models.post_install.connect(create_nagios)
