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

    def save_config(self, conf_dict, snapconf):
        def _save_items(confobj, obj_id, parent_model_inst, modelstack):
            if isinstance(modelstack[0], tuple):
                child_model, child_conf_model = modelstack[0]
                rel_obj = self.find_relation(parent_model_inst, child_model)
                model_instance = rel_obj.get_or_create(name=obj_id)[0] if obj_id is not None else rel_obj.all()[0]

                if "consistency" in confobj["data"] and confobj["data"]["consistency"]:
                    conf_rel_obj = self.find_relation(model_instance, child_conf_model)
                    conf_instance = conf_rel_obj.get_or_create(snapshot_conf=snapconf)[0]
                    conf_instance.consistency = confobj["data"]["consistency"]
                    conf_instance.save()
            else:
                child_model = modelstack[0]
                rel_obj = self.find_relation(parent_model_inst, child_model)
                model_instance = rel_obj.get_or_create(name=obj_id)[0] if obj_id is not None else rel_obj.all()[0]

            if "children" in confobj and confobj["children"]:
                for child_id, child_conf in confobj["children"].items():
                    _save_items(child_conf, child_id, model_instance, modelstack[1:])

        for host_id, host_conf in conf_dict[self.plugin_name].items():
            host_model = Host.objects.get(name=host_id)
            _save_items(host_conf, None, host_model, self.models)

        return True

    def create_items(self, conf_dict):
        def _create_subitem(confobj, obj_id, parent_model_inst, parent, modelstack):
            merged_data = parent.data.copy()
            merged_data.update(confobj["data"])

            if isinstance(modelstack[0], tuple):
                childmodel, childconfmodel = modelstack[0]
            else:
                childmodel = modelstack[0]
            rel_obj = self.find_relation(parent_model_inst, childmodel)
            model_instance = rel_obj.get_or_create(name=obj_id)[0] if obj_id is not None else rel_obj.all()[0]

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

    def find_relation(self, obj, rel_model):
        for related in obj._meta.get_all_related_objects():
            if related.model == rel_model:
                return getattr(obj, related.get_accessor_name())
