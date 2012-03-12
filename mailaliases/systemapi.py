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

from django.contrib.auth.models import User

from systemd import invoke, logged, LockingPlugin, method

@logged
class SystemD(LockingPlugin):
    dbus_path = "/mailaliases"

    @method(in_signature="", out_signature="")
    def write_aliases(self):
        self.lock.acquire()
        try:
            # read current aliases
            fd = open( "/etc/aliases", "rb" )
            try:
                aliases = fd.read()
            finally:
                fd.close()

            aliases = dict([
                [part.strip() for part in line.split(":")]
                for line in aliases.split("\n")
                if line.strip() and line[0] != '#'
                ])

            for user in User.objects.all():
                if user.email and user.is_active and user.is_superuser:
                    aliases[user.username] = user.email
                elif user.username in aliases:
                    del aliases[user.username]

            aliases["root"] = ', '.join([ user.username
                for user in User.objects.filter(is_active=True, is_superuser=True).exclude(email="")
                ])

            fd = open( "/etc/aliases", "wb" )
            try:
                users = aliases.keys()
                users.sort()
                for username in users:
                    fd.write("%s: %s\n" % ( username, aliases[username] ))
            finally:
                fd.close()
        finally:
            self.lock.release()

    @method(in_signature="", out_signature="i")
    def newaliases(self):
        return invoke(["newaliases"])
