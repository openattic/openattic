# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os, sys
import dbus.service
import logging
from functools import wraps

from django.conf import settings

from procutils import invoke, lvm_vgs, lvm_lvs

def dbus_type_to_python(obj):
    conv = {
        dbus.Array: list,
        dbus.Dictionary: dict,
        dbus.Boolean: bool,
        dbus.Int16: int,
        dbus.Int32: int,
        dbus.Int64: int,
        dbus.String: unicode
        }
    return conv[type(obj)](obj)

def dbus_to_python(obj):
    py = dbus_type_to_python(obj)
    if isinstance(py, list):
        return [dbus_to_python(el) for el in py]
    elif isinstance(py, dict):
        return dict([(dbus_type_to_python(key), dbus_to_python(obj[key])) for key in py])
    return py

def makeloggedfunc(func):
    """ Create a wrapper around the method that does some logging """
    if hasattr(func, "im_class") and hasattr(func.im_class, "dbus_path"):
        @wraps(func)
        def loggedfunc(*args, **kwargs):
            logging.info( "Calling %s::%s(%s)", func.im_class.dbus_path, func.__name__,
                ', '.join([repr(arg) for arg in args[1:]]))
            return func(*args, **kwargs)
    else:
        @wraps(func)
        def loggedfunc(*args, **kwargs):
            logging.info( "Calling %s(%s)", func.__name__, ', '.join([repr(arg) for arg in args[1:]]))
            return func(*args, **kwargs)
    return loggedfunc

def logged(cls):
    """ Search for methods that are exported via DBus and put a log wrapper around them """
    for attr in dir(cls):
        func = getattr(cls, attr)
        if hasattr(func, "_dbus_is_method") and func._dbus_is_method and func.__name__ != "Introspect":
            setattr( cls, attr, makeloggedfunc(func) )
    return cls

@logged
class SystemD(dbus.service.Object):
    dbus_path = "/lvm"

    def __init__(self, bus, busname):
        self.bus     = bus
        self.busname = busname
        dbus.service.Object.__init__(self, self.bus, self.dbus_path)

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="a{sa{ss}}")
    def vgs(self):
        return lvm_vgs()

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="a{sa{ss}}")
    def lvs(self):
        return lvm_lvs()

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="ssis", out_signature="i")
    def lvcreate(self, vgname, lvname, megs, snapshot):
        cmd = ["/sbin/lvcreate"]
        if snapshot:
            cmd.extend(["-s", snapshot])
        cmd.extend(["-L", ("%dM" % megs),
            '-n', lvname,
            vgname
            ])
        return invoke(cmd)

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="sb", out_signature="i")
    def lvchange(self, device, active):
        return invoke(["/sbin/lvchange", ('-a' + {False: 'n', True: 'y'}[active]), device])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="si", out_signature="i")
    def lvresize(self, device, megs):
        return invoke(["/sbin/lvresize", '-L', ("%dM" % megs), device])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def lvremove(self, device):
        return invoke(["/sbin/lvremove", '-f', device])


    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="sss", out_signature="i")
    def fs_mount(self, fstype, devpath, mountpoint):
        if not os.path.exists(mountpoint):
            os.makedirs(mountpoint)
        return invoke(["/bin/mount", "-t", fstype, devpath, mountpoint])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="ss", out_signature="i")
    def fs_unmount(self, devpath, mountpoint):
        if not os.path.exists(mountpoint) or not os.path.ismount(mountpoint):
            return -1
        ret = invoke(["/bin/umount", mountpoint])
        if ret == 0 and os.path.exists(mountpoint):
            os.rmdir(mountpoint)
        return ret

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="sss", out_signature="i")
    def fs_chown(self, mountpoint, user, group):
        if group:
            return invoke(["/bin/chown", "-R", ("%s:%s" % (user, group)), mountpoint])
        else:
            return invoke(["/bin/chown", "-R", user, mountpoint])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="a{ss}")
    def e2fs_info(self, devpath):
        ret, out, err = invoke(["/sbin/tune2fs", "-l", devpath], return_out_err=True)
        return dict([ [part.strip() for part in line.split(":", 1)] for line in out.split("\n")[1:] if line ])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="ss", out_signature="i")
    def e2fs_format(self, devpath, label):
        return invoke(["/sbin/mke2fs", "-m0", "-L", label, devpath])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def e2fs_check(self, devpath):
        return invoke(["/sbin/e2fsck", "-y", "-f", devpath])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="si", out_signature="i")
    def e2fs_resize(self, devpath, megs):
        return invoke(["/sbin/resize2fs", devpath, ("%dM" % megs)])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="ss", out_signature="i")
    def e3fs_format(self, devpath, label):
        return invoke(["/sbin/mke2fs", "-j", "-m0", "-L", label, devpath])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="ss", out_signature="i")
    def e4fs_format(self, devpath, label):
        return invoke(["/sbin/mkfs.ext4", "-m0", "-L", label, devpath])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="i")
    def ntfs_format(self, devpath):
        return invoke(["/sbin/mkntfs", "--fast", devpath])

    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="si", out_signature="i")
    def ntfs_resize(self, devpath, megs):
        return invoke(["/sbin/ntfsresize", "--force", "--size", ("%dM" % megs), devpath], stdin="y\n")
