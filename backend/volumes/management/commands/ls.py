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

            try:
                volume = StorageObject.objects.get(uuid=volname)
            except StorageObject.DoesNotExist:
                try:
                    volume = StorageObject.objects.get(name=volname)
                except StorageObject.DoesNotExist:
                    print "Volume not found!"
                    return

            printobj(get_storage_tree(volume.authoritative_obj), 0)
