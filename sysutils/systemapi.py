# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from systemd import invoke, logged, BasePlugin, method

@logged
class SystemD(BasePlugin):
    dbus_path = "/sysutils"

    @method(in_signature="", out_signature="i")
    def shutdown(self):
        return invoke(["init", "0"])

    @method(in_signature="", out_signature="i")
    def reboot(self):
        return invoke(["init", "6"])

 
