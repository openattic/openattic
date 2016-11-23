# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

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
import logging
import re
import os
import os.path
try:
    import rtslib_fb as rtslib
except ImportError:
    import rtslib

from django.db.models import signals

import sysutils.models

from ifconfig.models import Host, IPAddress

logger = logging.getLogger(__name__)


def create_fc_objects(**kwargs):
    if not os.path.exists("/sys/module/qla2xxx"):
        # Module not loaded, there's probably no FC adapter installed
        return
    if not os.path.exists("/sys/module/qla2xxx/parameters/qlini_mode"):
        # There's an adapter installed, but qlini_mode doesn't exist for some reason
        return

    host  = Host.objects.get_current()
    qlini = open("/sys/module/qla2xxx/parameters/qlini_mode", "rb").read().strip()

    unseen_ini_wwns = [ini.wwn for ini in host.initiator_set.filter(type="qla2xxx")]

    try:
        fabric = rtslib.FabricModule("qla2xxx")
    except KeyError:
        logger.info('There is no FabricModule("qla2xxx")')
        return


    for hba in os.listdir("/sys/class/fc_host"):
        port_name = open(os.path.join("/sys/class/fc_host", hba, "port_name"), "rb").read().strip()
        # port_name is a string like "0x2100001b329b579e". strip the 0x, and
        # convert to 21:00:00:1b:32:9b:57:9e notation.
        port_wwn = re.sub(r"(\w\w)", r"\1:", port_name.strip("0x")).rstrip(":")

        if qlini == "enabled":
            # We're an initiator
            if port_wwn in unseen_ini_wwns:
                # Initiator exists
                print "Found existing initiator", port_wwn
                unseen_ini_wwns.remove(port_wwn)
            else:
                print "Found new initiator", port_wwn
                host.initiator_set.create(type="qla2xxx", wwn=port_wwn)
        else:
            # We're a target, make sure LIO knows it
            for lio_tgt in fabric.targets:
                if lio_tgt.wwn == port_wwn:
                    break
            else:
                rtslib.Target(fabric, port_wwn)

    for ini_wwn in unseen_ini_wwns:
        print "Removing unseen initiator", ini_wwn
        host.initiator_set.get(wwn=ini_wwn).delete()

sysutils.models.post_install.connect(create_fc_objects, sender=sysutils.models)


def create_ip_portals(instance, **kwargs):
    if not instance.primary_address:
        return
    if instance.portal_set.count() > 0:
        return
    instance.portal_set.create()

signals.post_save.connect(create_ip_portals, sender=IPAddress)
