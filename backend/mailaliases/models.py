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

from django.db.models import signals
from django.contrib.auth.models import User

from systemd import get_dbus_object

def update_contacts(**kwargs):
    als = get_dbus_object("/mailaliases")
    als.write_aliases()
    als.newaliases()

def update_contacts_for_edit(instance, **kwargs):
    try:
        old_user = User.objects.get(id=instance.id)
    except User.DoesNotExist:
        old_user = None
    if old_user is None or instance.email != old_user.email:
        update_contacts()

signals.pre_save.connect(    update_contacts_for_edit, sender=User )
signals.post_delete.connect( update_contacts, sender=User )
