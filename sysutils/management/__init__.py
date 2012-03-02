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

try:
    import readline
except ImportError:
    pass

import sysutils.models
from sysutils.models  import NTP
from django.db.models import signals

def create_ntp(app, created_models, verbosity, **kwargs):
    try:
        NTP.objects.get(id=1)
    except NTP.DoesNotExist:
        if not kwargs.get('interactive', True):
            print "Skipping initialization of the NTP module."
    else:
        print "The NTP module has already been initialized before."
        return

    if kwargs.get('interactive', True):
        server = raw_input("Please enter the address of the NTP server: ")
        s = NTP(id=1, server=server)
        s.save()
        print "The NTP module has been initialized successfully."

signals.post_syncdb.connect(create_ntp, sender=sysutils.models)
