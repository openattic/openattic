# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.dispatch import Signal

pre_install     = Signal()
post_install    = Signal()

pre_uninstall   = Signal()
post_uninstall  = Signal()

pre_shrink      = Signal(providing_args=["jid"])
post_shrink     = Signal(providing_args=["jid"])
pre_grow        = Signal(providing_args=["jid"])
post_grow       = Signal(providing_args=["jid"])

pre_format      = Signal()
post_format     = Signal()

pre_mount       = Signal(providing_args=["device", "mountpoint"])
post_mount      = Signal(providing_args=["device", "mountpoint"])
pre_unmount     = Signal(providing_args=["mountpoint"])
post_unmount    = Signal(providing_args=["mountpoint"])


