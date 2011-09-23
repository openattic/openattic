# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus
from django.conf import settings

from rpcd.handlers import BaseHandler
from sysutils.models import InitScript

class SysUtilsHandler(object):
    class model:
        class _meta:
            app_label = "sysutils"
            object_name = "System"

    def __init__(self, user):
        self.user = user

    def shutdown(self):
        dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/sysutils").shutdown()

    def reboot(self):
        dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/sysutils").reboot()

class InitScriptHandler(BaseHandler):
    model = InitScript

    def get_status(self, id):
        return InitScript.objects.get(id=id).status

    def all_with_status(self):
        """ Get all initscripts with their current status values """
        data = []
        for obj in self.model.objects.all():
            objdata = self._getobj(obj)
            objdata["status"] = obj.status
            data.append(objdata)
        return data

RPCD_HANDLERS = [SysUtilsHandler, InitScriptHandler]
