# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from lvm.procutils   import invoke
from lvm.models      import VolumeGroup, LogicalVolume

def register_options(parser):
    parser.add_option( "-r", "--remount",
        help="Remount all LVs.",
        action="store_true", default=False
        )

def inst(options, args):
    if LogicalVolume.objects.filter(state="new").count() > 0:
        for lv in LogicalVolume.objects.filter(state="new"):
            lv.state = "pending"
            lv.save()

            invoke(["lvcreate",
                "-L", ("%dM" % lv.megs),
                '-n', lv.name,
                lv.vg.name
                ])

            invoke(["lvchange", '-ay', lv.path])

            if lv.filesystem:
                lv.fs.format()
                if lv.fs.mountable:
                    lv.fs.mount()

            lv.state = "active"
            lv.save()

def postinst(options, args):
    if options.remount:
        for lv in LogicalVolume.objects.filter(state="active"):
            if lv.filesystem and lv.fs.mountable:
                lv.fs.unmount()
                lv.fs.mount()

def rm(options, args):
    if LogicalVolume.objects.filter(state="delete").count() > 0:
        for lv in LogicalVolume.objects.filter(state="delete"):
            lv.state = "dpend"
            lv.save()

            if lv.filesystem and lv.fs.mountable:
                lv.fs.unmount()

            invoke(["lvchange", '-an', lv.path])
            invoke(["lvremove", lv.path])

            lv.state = "done"
            lv.save()

