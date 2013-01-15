# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os
import dbus

from django.conf import settings

from systemd.procutils import invoke
from systemd.helpers import dbus_to_python
from lvm.conf import settings as lvm_settings

def get_initscripts():
    return os.listdir(lvm_settings.VOLUME_INITD)

def get_initscript_info(script):
    if script.startswith("/"):
        script = script[1:]
    scpath = os.path.join(lvm_settings.VOLUME_INITD, script)
    ret, out, err = invoke([scpath, "metadata"], return_out_err=True, log=False)
    return dict([ line.split("=", 1) for line in out.split("\n") if line ])

def run_initscript(lv, script):
    info = get_initscript_info(script)
    if info["REQUIRES_FS"] == "true" and not lv.filesystem:
        raise ValueError("This init script can only be used for volumes that have a file system.")
    lvm = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/lvm")
    return dbus_to_python(lvm.run_initscript(script, lv.device, lv.mountpoint if lv.filesystem else ""))
