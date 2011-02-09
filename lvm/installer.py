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
            lv.set_pending()

            cmd = ["/sbin/lvcreate"]
            if lv.snapshot:
                cmd.extend(["-s", lv.snapshot.path])
            cmd.extend(["-L", ("%dM" % lv.megs),
                '-n', lv.name,
                lv.vg.name
                ])
            invoke(cmd)

            invoke(["/sbin/lvchange", '-ay', lv.path])

            if lv.filesystem:
                lv.fs.format()
                if lv.fs.mountable:
                    lv.fs.mount()
                    lv.fs.chown()

    if LogicalVolume.objects.filter(state="update").count() > 0:
        for lv in LogicalVolume.objects.filter(state="update"):
            lv.set_pending()

            if lv.filesystem and lv.fs.mountable:
                lv.fs.unmount()

            if lv.megs < lv.lvm_megs:
                # Shrink FS, then Volume
                if lv.filesystem:
                    lv.fs.resize(grow=False)
                invoke(["/sbin/lvchange", '-an', lv.path])
                invoke(["/sbin/lvresize", '-L',  ("%dM" % lv.megs), lv.path])
                invoke(["/sbin/lvchange", '-ay', lv.path])
            else:
                # Grow Volume, then FS
                invoke(["/sbin/lvchange", '-an', lv.path])
                invoke(["/sbin/lvresize", '-L',  ("%dM" % lv.megs), lv.path])
                invoke(["/sbin/lvchange", '-ay', lv.path])
                if lv.filesystem:
                    lv.fs.resize(grow=True)

            if lv.filesystem and lv.fs.mountable:
                lv.fs.mount()


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
            lv.set_dpend()

            if lv.filesystem and lv.fs.mountable:
                lv.fs.unmount()

            invoke(["/sbin/lvchange", '-an', lv.path])
            invoke(["/sbin/lvremove", lv.path])

def cleanup(options, args):
    LogicalVolume.objects.filter(state="pending").update(state="active")
    LogicalVolume.objects.filter(state="dpend"  ).update(state="done"  )

