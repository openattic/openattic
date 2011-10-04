# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler

from munin.models import MuninNode

class MuninNodeHandler(ModelHandler):
    model = MuninNode

    def get_modules(self, obj):
        """ Return a list of modules loaded by the given Munin node. """
        mn = MuninNode.objects.get(id=obj)
        return mn.modules

    def get_module_url(self, obj, module, time):
        """ Return an image URL for the given node, module and time (day/week/month/year). """
        mn = MuninNode.objects.get(id=obj)
        return mn.get_module_url(module, time)

RPCD_HANDLERS = [MuninNodeHandler]
