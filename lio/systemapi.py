# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2013, it-novum GmbH <community@open-attic.org>
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

import logging

from rtslib          import target

from ifconfig.models import Host
from systemd         import dbus_to_python
from systemd.plugins import logged, BasePlugin, method, deferredmethod

from lio             import models


@logged
class SystemD(BasePlugin):
    dbus_path = "/lio"

    @method(in_signature="i", out_signature="")
    def backstore_delete(self, id):
        models.Backstore.objects.get(id=dbus_to_python(id)).lio_object.delete()

    @method(in_signature="i", out_signature="")
    def storage_object_create(self, id):
        mdl_so = models.StorageObject.objects.get(id=dbus_to_python(id))
        lio_bs = mdl_so.backstore.lio_object
        kwargs = {"gen_wwn": False}
        if mdl_so.backstore.type == "fileio":
            kwargs.update({"size": "%dM" % mdl_so.volume.storageobj.megs})
        storage = lio_bs.storage_object(mdl_so.volume.storageobj.name, mdl_so.volume.volume.path, **kwargs)
        storage.wwn = mdl_so.wwn

    @method(in_signature="i", out_signature="")
    def storage_object_delete(self, id):
        try:
            models.StorageObject.objects.get(id=dbus_to_python(id)).lio_object.delete()
        except KeyError:
            pass

    @method(in_signature="i", out_signature="")
    def target_create(self, id):
        mdl_tgt = models.Target.objects.get(id=dbus_to_python(id))
        fabric  = target.FabricModule(mdl_tgt.type)
        if not fabric.exists:
            for mod in fabric.load(): pass
        if not fabric.exists:
            raise SystemError("failed to load fabric module for '%s'" % mdl_tgt.type)
        lio_tgt = target.Target(fabric, mdl_tgt.wwn)

    @method(in_signature="i", out_signature="")
    def target_delete(self, id):
        try:
            models.Target.objects.get(id=dbus_to_python(id)).lio_object.delete()
        except KeyError:
            pass

    @method(in_signature="i", out_signature="")
    def tpg_create(self, id):
        mdl_tpg = models.TPG.objects.get(id=dbus_to_python(id))
        lio_tgt = mdl_tpg.target.lio_object
        lio_tpg = target.TPG(lio_tgt, mdl_tpg.tag)
        if mdl_tpg.target.type == "iscsi":
            lio_tpg.set_attribute("authentication",      str(int(mdl_tpg.chapauth)))
        lio_tpg.set_attribute("generate_node_acls",      "0")
        lio_tpg.set_attribute("demo_mode_write_protect", "0")
        #lio_tpg.set_parameter("InitialR2T",             "No") # → Invalid Argument <_<
        lio_tpg.enable = True

    @method(in_signature="i", out_signature="s")
    def tpg_getpath(self, id):
        """ Used for debugging purposes only, may be safely removed after #OA-51 has been fixed """
        mdl_tpg = models.TPG.objects.get(id=dbus_to_python(id))
        return mdl_tpg.lio_object.path

    @method(in_signature="i", out_signature="")
    def tpg_delete(self, id):
        try:
            models.TPG.objects.get(id=dbus_to_python(id)).lio_object.delete()
        except KeyError:
            pass

    @method(in_signature="i", out_signature="")
    def lun_create(self, id):
        mdl_lun = models.LUN.objects.get(id=dbus_to_python(id))
        lio_tpg = mdl_lun.tpg.lio_object
        lio_lun = lio_tpg.lun(mdl_lun.lun_id, mdl_lun.storageobj.lio_object,
                        "%s_at_%s" % (mdl_lun.storageobj.volume.storageobj.name, Host.objects.get_current().name))

    @method(in_signature="ii", out_signature="")
    def lun_map(self, id, acl_id):
        mdl_lun = models.LUN.objects.get(id=dbus_to_python(id))
        mdl_acl = mdl_lun.tpg.acl_set.get(id=dbus_to_python(acl_id))
        mdl_acl.lio_object.mapped_lun(mdl_lun.lun_id, mdl_lun.lio_object)

    @method(in_signature="ii", out_signature="")
    def lun_unmap(self, id, acl_id):
        mdl_lun = models.LUN.objects.get(id=dbus_to_python(id))
        mdl_acl = mdl_lun.tpg.acl_set.get(id=dbus_to_python(acl_id))
        for lio_mlun in mdl_acl.lio_object.mapped_luns:
            if lio_mlun.tpg_lun.storage_object.wwn == mdl_lun.storageobj.wwn:
                lio_mlun.delete()

    @method(in_signature="i", out_signature="")
    def lun_delete(self, id):
        try:
            models.LUN.objects.get(id=dbus_to_python(id)).lio_object.delete()
        except KeyError:
            pass

    @method(in_signature="ii", out_signature="")
    def portal_create(self, id, tpg_id):
        mdl_ptl = models.Portal.objects.get(id=dbus_to_python(id))
        mdl_tpg = models.TPG.objects.get(id=dbus_to_python(tpg_id))
        lio_tpg = mdl_tpg.lio_object
        lio_tpg.network_portal(mdl_ptl.ipaddress.host_part, mdl_ptl.port)

    @method(in_signature="ii", out_signature="")
    def portal_delete(self, id, tpg_id):
        mdl_ptl = models.Portal.objects.get(id=dbus_to_python(id))
        mdl_tpg = models.TPG.objects.get(id=dbus_to_python(tpg_id))
        lio_tpg = mdl_tpg.lio_object
        for lio_ptl in lio_tpg.network_portals:
            if lio_ptl.ip_address == mdl_ptl.ipaddress.host_part and lio_ptl.port == mdl_ptl.port:
                lio_ptl.delete()

    @method(in_signature="i", out_signature="")
    def acl_create(self, id):
        mdl_acl = models.ACL.objects.get(id=dbus_to_python(id))
        lio_tpg = mdl_acl.tpg.lio_object
        lio_acl = lio_tpg.node_acl(mdl_acl.initiator.wwn)

    @method(in_signature="i", out_signature="")
    def acl_delete(self, id):
        try:
            models.ACL.objects.get(id=dbus_to_python(id)).lio_object.delete()
        except KeyError:
            pass

    @deferredmethod(in_signature="i")
    def install_hostacl(self, id, sender):
        hostacl = models.HostACL.objects.get(id=id)
        models.ProtocolHandler.install_hostacl(hostacl)

    @deferredmethod(in_signature="")
    def saveconfig(self, sender):
        # LIO is a pretty fast moving target currently, especially when it comes to saving the
        # config. We want to deal with this situation without having to hardcode Distro versions,
        # so we'll just have to try all the known ways and see which one works here.

        # this works at least on Debian <= Wheezy and Ubuntu <= 14.04
        # ripped from /usr/share/pyshared/targetcli/ui_root.py (ui_command_saveconfig function)
        try:
            from tcm_dump import tcm_full_backup
            tcm_full_backup(None, None, '1', None)
            return
        except ImportError:
            logging.warn("tcm_full_backup is unavailable.")

        # the following works for CentOS 7, but will not work anymore for Debian sid and jessie
        try:
            from rtslib.root import RTSRoot
            root = RTSRoot()
            root.save_to_file()
            return
        except AttributeError:
            logging.warn("RTSRoot.save_to_file is unavailable.")

        # still no luck, let's try the Debian sid way
        try:
            from targetcli.cli_config import CliConfig
            CliConfig.save_running_config()
            return
        except (ImportError, AttributeError):
            logging.warn("CliConfig.save_running_config is unavailable.")

        # now, being a smartass and trying to invoke(["targetcli"], stdin="cd /\nsaveconfig\nyes\n")
        # would just lead to targetcli complaining about the following:
        #
        # Traceback (most recent call last):
        #   File "/usr/bin/targetcli", line 89, in <module>
        #     main()
        #   File "/usr/bin/targetcli", line 82, in main
        #     shell.run_interactive()
        #   File "/usr/lib/python2.7/site-packages/configshell/shell.py", line 955, in run_interactive
        #     readline.set_completer(old_completer)
        # NameError: global name 'readline' is not defined
        #
        # So, this won't work.

        raise SystemError(
            "Config cannot be saved because none of the ways we know of are available on your system. "
            "This is likely a bug. Please contact the openATTIC team at http://open-attic.org.")

