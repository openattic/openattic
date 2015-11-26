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

import os

from ConfigParser import ConfigParser

from django.core.management.base import BaseCommand
from django.contrib.auth.models  import User

from rpcd.models   import APIKey

class Command( BaseCommand ):
    help = "Create a default oacli config file if none exists."

    def handle(self, **options):
        if os.path.exists("/etc/openattic/cli.conf"):
            print "/etc/openattic/cli.conf already exists"
            return

        try:
            admin = User.objects.get(username="openattic", is_superuser=True)
        except User.DoesNotExist:
            admin = User.objects.filter( is_superuser=True )[0]

        key = APIKey( owner=admin, description="oacli access", active=True )
        key.full_clean()
        key.save()

        conf = ConfigParser()
        conf.add_section("options")
        conf.set("options", "connect", "http://__:%s@localhost:31234/" % key.apikey)
        conf.set("options", "uidcheck", True)
        conf.write( open( "/etc/openattic/cli.conf", "wb" ) )

