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

from django.core.management.base import BaseCommand

from ceph.models import Pool

class Command( BaseCommand ):
    help = "Dump the Ceph OSD tree as known to openATTIC."

    def handle(self, **options):
        for pool in Pool.objects.all():
            print " * %-20s size=%-3d min_size=%-3d rule: %s" % (pool, pool.size, pool.min_size, pool.ruleset.get_description())
