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

from django.core.management.base import BaseCommand

from volumes.models import StorageObject, get_storage_tree

class Command(BaseCommand):
    help = "Lists all StorageObjects or prints the storage device tree if a volume name is given."

    def handle(self, volname=None, **options):
        if volname is None:
            for so in StorageObject.objects.all().order_by("name"):
                print "%-20s %-10s %s" % (so, so.get_status()["status"], so.uuid)

        else:
            def printobj(obj, level):
                print "%-20s %-10s" % ("%s%s" % (" " * level, obj["title"]), obj["status"])

                if "devices" in obj:
                    for childdev in obj["devices"]:
                        printobj(childdev, level + 1)

            obj = StorageObject.objects.get(name=volname).authoritative_obj
            printobj(get_storage_tree(obj), 0)
