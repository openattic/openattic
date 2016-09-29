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

import json
from pwd import getpwnam

import os

from systemd import dbus_to_python
from systemd import get_dbus_object
from systemd.procutils import invoke
from systemd.plugins import logged, BasePlugin, method


def salt_cmd(func):
    """:rtype: dict | list"""
    return json.loads(dbus_to_python(func(get_dbus_object("/ceph_deployment"))))


@logged
class SystemD(BasePlugin):
    dbus_path = '/ceph_deployment'

    @method(in_signature='', out_signature='s')
    def invoke_salt_key(self):
        return invoke(['salt-key', '--out=json'], log=True, return_out_err=True)[1]

    @method(in_signature='as', out_signature='s')
    def invoke_salt_run(self, args):
        return invoke(['salt-run', '--out=json'] + args, log=True, return_out_err=True)[1]

    @method(in_signature='as', out_signature='s')
    def invoke_salt_run_quiet(self, args):
        return invoke(['salt-run', '--out=quiet'] + args, log=True, return_out_err=True)[1]


    @method(in_signature='as', out_signature='s')
    def invoke_salt(self, args):
        return invoke(['salt', '--out=json', '--static'] + args, log=True, return_out_err=True)[1]

    @method(in_signature='ss', out_signature='')
    def write_pillar_file(self, file_path, content):
        assert file_path.startswith('/srv/pillar')
        with open(file_path, "w") as f:
            f.write(content)

        pwn_salt = getpwnam('salt')
        os.chown(file_path, pwn_salt.pw_uid, pwn_salt.pw_gid)
