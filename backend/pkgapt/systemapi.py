# -*- coding: utf-8 -*-

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

import apt
from systemd.plugins import logged, BasePlugin, method

@logged
class SystemD(BasePlugin):
    dbus_path = "/pkgapt"

    @method(in_signature="", out_signature="")
    def update(self):
        ca = apt.cache.Cache()
        ca.update()

    @method(in_signature="b", out_signature="a{si}aa{sv}")
    def get_upgrade_changes(self, distupgrade):
        ca = apt.cache.Cache()
        ca.upgrade(distupgrade)
        data = []
        for pkg in ca.get_changes():
            pinfo = {"name": pkg.name,
                "marked_install": pkg.marked_install,
                "marked_upgrade": pkg.marked_upgrade,
                "marked_downgrade": pkg.marked_downgrade,
                "marked_delete": pkg.marked_delete,
                }
            if pkg.installed:
                pinfo["installed_version"] = pkg.installed.version
            else:
                pinfo["installed_version"] = ""
            if pkg.candidate:
                pinfo["candidate_version"] = pkg.candidate.version
            else:
                pinfo["candidate_version"] = ""
            data.append(pinfo)

        return {
            'broken_count':      ca.broken_count,
            'upgrade_count':     len([ change for change in ca.get_changes() if change.installed ]),
            'new_install_count': len([ change for change in ca.get_changes() if not change.installed ]),
            'install_count':     ca.install_count,
            'keep_count':        ca.keep_count,
            'delete_count':      ca.delete_count,
            'req_download':      ca.required_download,
            'req_space':         ca.required_space,
            }, data

    @method(in_signature="b", out_signature="")
    def do_upgrade(self, distupgrade):
        ca = apt.cache.Cache()
        ca.upgrade(distupgrade)
        ca.commit()
