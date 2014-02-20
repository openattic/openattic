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

from optparse import make_option

from django.core.management.base import BaseCommand

from lvm.models import LVSnapshotJob

class Command( BaseCommand ):
    help = "Creates a Snapshot."

    option_list = BaseCommand.option_list + (
        make_option( "-j", "--jobid", type=int,
            help="Snapshot job ID",
            ),
    )

    def handle(self, **options):
        job = LVSnapshotJob.objects.get(id=options["jobid"])
        print "doing stuff now"
        job.dosnapshot()
