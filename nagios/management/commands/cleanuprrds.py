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

import os

from optparse import make_option

from django.core.management.base import BaseCommand

from nagios.models import Service
from nagios.conf import settings as nagios_settings

class Command( BaseCommand ):
    help = "Remove RRD files which do not appear to belong to any currently configured service."

    option_list = BaseCommand.option_list + (
        make_option( "-d", "--dryrun", default=False, action="store_true",
            help="Only print what would be deleted, don't actually delete anything."
            ),
        )

    def handle(self, **options):
        known_services = [
            serv["description"].replace(" ", "_") for serv in Service.objects.values("description")
            ]
        basedir = os.path.dirname(nagios_settings.RRD_PATH)
        for fullname in os.listdir( basedir ):
            name, ext = fullname.rsplit('.', 1)
            if name == "_HOST_":
                continue
            if name not in known_services:
                if options["dryrun"]:
                    print os.path.join( basedir, fullname )
                else:
                    os.unlink( os.path.join( basedir, fullname ) )
