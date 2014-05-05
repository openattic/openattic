# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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

import re
import os
import os.path

from django.db.models import signals

import sysutils.models

from ifconfig.models import Host, IPAddress


def create_fc_objects(**kwargs):
    if not os.path.exists("/sys/module/qla2xxx"):
        # Module not loaded, there's probably no FC adapter installed
        return
    if not os.path.exists("/sys/module/qla2xxx/parameters/qlini_mode"):
        # There's an adapter installed, but qlini_mode doesn't exist for some reason
        return

    host  = Host.objects.get_current()
    qlini = open("/sys/module/qla2xxx/parameters/qlini_mode", "rb").read().strip()

    unseen_tgt_wwns = [tgt.wwn for tgt in host.target_set.filter(type="qla2xxx")]
    unseen_ini_wwns = [ini.wwn for ini in host.initiator_set.filter(type="qla2xxx")]

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
            # We're a target
            if port_wwn in unseen_tgt_wwns:
                # Target exists
                print "Found existing target", port_wwn
                unseen_tgt_wwns.remove(port_wwn)
            else:
                print "Found new target", port_wwn
                symname = open(os.path.join("/sys/class/fc_host", hba, "symbolic_name"), "rb").read().strip()
                host.target_set.create(type="qla2xxx", wwn=port_wwn, name=("%s: %s" % (hba, symname)))

    for ini_wwn in unseen_ini_wwns:
        print "Removing unseen initiator", ini_wwn
        host.initiator_set.get(wwn=ini_wwn).delete()

    for tgt_wwn in unseen_tgt_wwns:
        print "Removing unseen target", tgt_wwn
        host.target_set.get(wwn=tgt_wwn).delete()

sysutils.models.post_install.connect(create_fc_objects, sender=sysutils.models)


def create_ip_portals(instance, **kwargs):
    if not instance.primary_address:
        return
    if instance.portal_set.count() > 0:
        return
    instance.portal_set.create()

signals.post_save.connect(create_ip_portals, sender=IPAddress)
