# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from lvm.procutils   import invoke
from lvm.models      import VolumeGroup, LogicalVolume

def register_options(parser):
    parser.add_option( "-r", "--remount",
        help="Remount all LVs.",
        action="store_true", default=False
        )

    parser.add_option( "-u", "--unmount",
        help="Unmount all LVs.",
        action="store_true", default=False
        )

    parser.add_option( "-m", "--mount",
        help="Mount all LVs.",
        action="store_true", default=False
        )

def inst(options, args):
    if LogicalVolume.objects.filter(state="new").count() > 0:
        for lv in LogicalVolume.objects.filter(state="new"):
            lv.state = "pending"
            lv.save()

            invoke(["/sbin/lvcreate",
                "-L", ("%dM" % lv.megs),
                '-n', lv.name,
                lv.vg.name
                ])

            invoke(["/sbin/lvchange", '-ay', lv.path])

            if lv.filesystem:
                lv.fs.format()
                if lv.fs.mountable:
                    lv.fs.mount()
                    lv.fs.chown()

            lv.state = "active"
            lv.save()

def postinst(options, args):
    for lv in LogicalVolume.objects.filter(state="active"):
        if lv.filesystem and lv.fs.mountable:
            if options.remount or options.unmount:
                lv.fs.unmount()
            if options.remount or options.mount:
                lv.fs.mount()

def rm(options, args):
    if LogicalVolume.objects.filter(state="delete").count() > 0:
        for lv in LogicalVolume.objects.filter(state="delete"):
            lv.state = "dpend"
            lv.save()

            if lv.filesystem and lv.fs.mountable:
                lv.fs.unmount()

            invoke(["/sbin/lvchange", '-an', lv.path])
            invoke(["/sbin/lvremove", lv.path])

            lv.state = "done"
            lv.save()

