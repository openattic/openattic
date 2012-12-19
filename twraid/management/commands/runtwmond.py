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

from time import time, sleep

from django.core.management.base import BaseCommand

from twraid.procutils import query_ctls, update_database

class Command(BaseCommand):
    help = "Periodically updates the TWRAID status database."

    def handle(self, **options):
        while True:
            nexttime = time() + 300
            update_database(query_ctls())
            inter = nexttime - time()
            print "Sleeping %d seconds..." % inter
            sleep(inter)
