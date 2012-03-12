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

from django.conf      import settings
from django.db        import models
from django.db.models import signals
from django.contrib.auth.models import User


def update_contacts(**kwargs):
    als = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/mailaliases")
    als.write_aliases()
    als.newaliases()

signals.post_save.connect(   update_contacts, sender=User )
signals.post_delete.connect( update_contacts, sender=User )
