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

import ssmtp.models
from ssmtp.models     import SSMTP
from django.db.models import signals

def create_ssmtp(app, created_models, verbosity, **kwargs):
    try:
        SSMTP.objects.get(id=1)
    except SSMTP.DoesNotExist:
        if not kwargs.get('interactive', True):
            print "Skipping initialization of the SSMTP module."
    else:
        print "The SSMTP module has already been initialized before."
        return

    if kwargs.get('interactive', True):
        mailhub       = raw_input("Please enter the mail hub that should be used to deliver email: ")
        root          = raw_input("Please enter the email address where mail for root should be sent to: ")
        rewriteDomain = raw_input("Please enter the domain from which mail should appear to be from: ")
        s = SSMTP(id=1, mailhub=mailhub, root=root, rewriteDomain=rewriteDomain)
        s.save()
        print "The SSMTP module has been initialized successfully."

signals.post_syncdb.connect(create_ssmtp, sender=ssmtp.models)
