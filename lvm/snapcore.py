# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

""" 
"""

class Container(object):
    def __init__(self, data, model_instance):
        self.data     = data
        self.children = []
        self.model_instance = model_instance

    def get_targets(self):
        targets = []
        for child in self.children:
            if isinstance(child, Container):
                targets.extend(child.get_targets())
            else:
                targets.append(child)
        return targets

class Target(object):
    def __init__(self, data, model_instance):
        self.data     = data
        self.model_instance = model_instance

class PluginLibrary(type):
    """ Meta class that keeps a library of defined plugins. """
    plugins = {}

    def __init__( cls, name, bases, attrs ):
        type.__init__( cls, name, bases, attrs )
        if name != "Plugin":
            PluginLibrary.plugins[ cls.plugin_name ] = cls

class Plugin(object):
    __metaclass__ = PluginLibrary
    plugin_name = "INITIALIZE ME"
    models      = "models"

    def restore_config(self):
      pass

    def save_config(self, conf_dict):
        def _save_items(confobj, instance, confmodel, parent):
            if confmodel is not None:
                confmodel.objects.save_config(confobj)
            for childid, childconf in confobj["children"].items():
                child = instance.get_child(childid)
                _save_items(childconf, child, "?", instance)

     # for hostconf in conf_dict[self.plugin_name].values():
      #    _save_items(hostconf, models)

    def create_items(self, conf_dict):
        def _create_subitem(confobj, parent):
            merged_data = parent.data.copy()
            merged_data.update(confobj["data"])
            if "children" in confobj and confobj["children"]:
                obj = Container(merged_data)
                parent.children.append(obj)
                for childconf in confobj["children"].values():
                    _create_subitem(childconf, obj)
            else:
                obj = Target(merged_data)
                parent.children.append(obj)
        plugindata = Container({})
        for hostconf in conf_dict[self.plugin_name].values():
            _create_subitem(hostconf, plugindata)
        return plugindata
