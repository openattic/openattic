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

from systemd.plugins import logged, BasePlugin, method
from cron.models   import Cronjob

@logged
class SystemD(BasePlugin):
    dbus_path = "/cron"

    @method(in_signature="", out_signature="")
    def writeconf(self):
        fd = open( "/etc/cron.d/openattic", "wb" )
        fd.write("SHELL=/bin/sh\n\n")
        try:
            for job in Cronjob.objects.all():
                fd.write( "%s %s %s %s %s %s %s\n" % ( job.minute, job.hour, job.domonth, job.month,
                    job.doweek, job.user, job.command) )
        finally:
            fd.close()
