# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from systemd import invoke, logged, BasePlugin, method

@logged
class SystemD(BasePlugin):
    dbus_path = "/stats"

    @method(in_signature="", out_signature="s")
    def ohai(self):
        # I know I should json.loads this here, but DBus doesn't recognize the types
        # correctly :/
        ret, out, err = invoke(["ohai"], return_out_err=True, log=False)
        return out
