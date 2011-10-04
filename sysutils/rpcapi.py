# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import dbus
from django.conf import settings

from rpcd.handlers import BaseHandler, ModelHandler
from sysutils.models import InitScript

class SysUtilsHandler(BaseHandler):
    @classmethod
    def _get_handler_name(cls):
        return "sysutils.System"

    def shutdown(self):
        dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/sysutils").shutdown()

    def reboot(self):
        dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/sysutils").reboot()

class InitScriptHandler(ModelHandler):
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
