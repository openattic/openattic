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

import os

from time import time, sleep

from systemd.procutils import invoke
from systemd.plugins   import logged, BasePlugin, method, deferredmethod

def stackcmd(resource, stacked, command, options=None):
    cmd = ["/sbin/drbdadm"]
    if stacked: cmd.append("-S")
    if options: cmd.extend(["--"] + options)
    cmd.extend([command, resource])
    return cmd

@logged
class SystemD(BasePlugin):
    dbus_path = "/drbd"

    @deferredmethod(in_signature="")
    def modprobe(self, sender):
        invoke(["modprobe", "drbd", "minor_count=255"])

    @deferredmethod(in_signature="sb")
    def createmd(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "create-md"), stdin="yes\n")

    @deferredmethod(in_signature="sb")
    def attach(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "attach"))

    @deferredmethod(in_signature="sb")
    def connect(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "connect"))

    @deferredmethod(in_signature="s")
    def wait_for_device(self, device, sender):
        # the device may or may not be busy completing a previous operation.
        # if so, wait for a max of ten seconds for the device to become available.
        start = time()
        while time() < start + 10:
            try:
                fd = os.open(device, os.O_RDWR|os.O_EXCL)
            except OSError:
                sleep(0.1)
            else:
                os.close(fd)
                return
        import errno
        raise OSError(errno.EBUSY, 'Device or resource busy', str(device))

    @deferredmethod(in_signature="sb")
    def up(self, resource, stacked, sender):
        sleep(1)
        try:
            invoke(stackcmd(resource, stacked, "up"))
        except SystemError:
            # Sometimes, this command fails with "device or resource busy"
            # and I have no idea why
            sleep(1)
            invoke(stackcmd(resource, stacked, "up"))

    @deferredmethod(in_signature="sb")
    def primary(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "primary"))

    @deferredmethod(in_signature="sb")
    def primary_overwrite(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "primary", ["--overwrite-data-of-peer"]))

    @deferredmethod(in_signature="sb")
    def primary_force(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "primary", ["--force"]))

    @deferredmethod(in_signature="sb")
    def secondary(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "secondary"))

    @deferredmethod(in_signature="sb")
    def adjust(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "adjust"))

    @deferredmethod(in_signature="sb")
    def disconnect(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "disconnect"))

    @deferredmethod(in_signature="sb")
    def detach(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "detach"))

    @deferredmethod(in_signature="sb")
    def down(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "down"))

    @deferredmethod(in_signature="sb")
    def pausesync(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "pause-sync"))

    @deferredmethod(in_signature="sb")
    def resumesync(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "resume-sync"))

    @deferredmethod(in_signature="sb")
    def resize(self, resource, stacked, sender):
        invoke(stackcmd(resource, stacked, "resize", ["--assume-clean"]))

    @method( in_signature="sb", out_signature="a{ss}")
    def get_dstate(self, resource, stacked):
        ret, out, err = invoke(stackcmd(resource, stacked, "dstate"), return_out_err=True, log=False)
        return dict(zip(("self", "peer"), out.strip().split("/")))

    @method( in_signature="sb", out_signature="s")
    def get_cstate(self, resource, stacked):
        ret, out, err = invoke(stackcmd(resource, stacked, "cstate"), return_out_err=True, log=False)
        return out.strip()

    @method( in_signature="sb", out_signature="a{ss}")
    def get_role(self, resource, stacked):
        ret, out, err = invoke(stackcmd(resource, stacked, "role"), return_out_err=True, log=False)
        return dict(zip(("self", "peer"), out.strip().split("/")))

    @deferredmethod( in_signature="ss")
    def conf_write(self, resource_name, conf, sender):
        with open("/etc/drbd.d/%s.res" % resource_name, "wb") as fd:
            fd.write(unicode(conf).encode("utf-8"))

    @deferredmethod( in_signature="s")
    def conf_delete(self, resource_name, sender):
        os.unlink("/etc/drbd.d/%s.res" % resource_name)
