# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from ifconfig.models import Host

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
        def _create_subitem(confobj, obj_id, parent_model_inst, parent, modelstack):
            print "_create_subitem"
            merged_data = parent.data.copy()
            merged_data.update(confobj["data"])

            print "model_instance = self.find_relation(%r, %r, %r)" % (parent_model_inst, modelstack[0], obj_id)
            if isinstance(modelstack[0], tuple):
                childmodel, childconfmodel = modelstack[0]
            else:
                childmodel = modelstack[0]
            model_instance = self.find_relation(parent_model_inst, childmodel, obj_id)
            print "model", model_instance

            if "children" in confobj and confobj["children"]:
                obj = Container(merged_data, model_instance)
                parent.children.append(obj)
                for child_id, child_conf in confobj["children"].items():
                  _create_subitem(child_conf, child_id, model_instance, obj, modelstack[1:])
            else:
                obj = Target(merged_data, model_instance)
                parent.children.append(obj)

        plugindata = Container({}, None)

        for host_id, host_conf in conf_dict[self.plugin_name].items():
            host_model = Host.objects.get(name=host_id)
            _create_subitem(host_conf, None, host_model, plugindata, self.models)

        return plugindata

    def find_relation(self, obj, rel_model, rel_obj_name=None):
        print obj
        for related in obj._meta.get_all_related_objects():
            if related.model == rel_model:
                rel_obj = getattr(obj, related.get_accessor_name())
                if rel_obj_name is not None:
                    return rel_obj.get_or_create(name=rel_obj_name)[0]
                else:
                    return rel_obj.all()[0]
