# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os

from systemd.procutils import invoke
from systemd import dbus_to_python, get_dbus_object
from volumes.conf import settings as volumes_settings

def get_initscripts():
    return os.listdir(volumes_settings.VOLUME_INITD)

def get_initscript_info(script):
    if script.startswith("/"):
        script = script[1:]
    scpath = os.path.join(volumes_settings.VOLUME_INITD, script)
    ret, out, err = invoke([scpath, "metadata"], return_out_err=True, log=False)
    return dict([ line.split("=", 1) for line in out.split("\n") if line ])

def run_initscript(volume, script):
    info = get_initscript_info(script)
    if info["REQUIRES_FS"] == "true" and not volume.filesystem:
        raise ValueError("This init script can only be used for volumes that have a file system.")
    dbus_object = get_dbus_object("/volumes")
    return dbus_to_python(dbus_object.run_initscript(script, volume.path))
