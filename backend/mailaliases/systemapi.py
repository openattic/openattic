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

from os.path import exists

from django.contrib.auth.models import User

from systemd.procutils import invoke
from systemd.plugins   import logged, BasePlugin, method

@logged
class SystemD(BasePlugin):
    dbus_path = "/mailaliases"

    @method(in_signature="", out_signature="")
    def write_aliases(self):
        # read current aliases
        if exists("/etc/aliases"):
            fd = open( "/etc/aliases", "rb" )
            try:
                aliases = fd.read()
            finally:
                fd.close()
        else:
            aliases = ""

        aliases = dict([
            [part.strip() for part in line.split(":")]
            for line in aliases.split("\n")
            if line.strip() and line[0] != '#'
            ])

        for user in User.objects.all():
            if user.email:
                aliases[user.username] = user.email
            elif user.username in aliases:
                del aliases[user.username]

        userqry = User.objects.filter(is_active=True, is_superuser=True).exclude(email="")
        if userqry.count():
            aliases["root"] = ', '.join([ user.username
                for user in userqry
                ])
        elif "root" in aliases:
            del aliases["root"]

        fd = open( "/etc/aliases", "wb" )
        try:
            users = aliases.keys()
            users.sort()
            for username in users:
                fd.write("%s: %s\n" % ( username, aliases[username] ))
        finally:
            fd.close()

    @method(in_signature="", out_signature="i")
    def newaliases(self):
        return invoke(["newaliases"], fail_on_err=False)
