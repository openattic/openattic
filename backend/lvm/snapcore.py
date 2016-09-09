# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;
# vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

import shlex

from datetime import datetime
from django.db import models

from systemd.procutils import invoke

from utilities import get_related_model


def process_config(conf_dict, snapconf):
    if len(conf_dict["data"]["prescript"]) > 0:
        invoke(shlex.split(conf_dict["data"]["prescript"]))

    targets = []
    for plugin_name, plugin in PluginLibrary.plugins.items():
        plugin_inst = plugin()

        if plugin_name in conf_dict["plugin_data"]:
            container = plugin_inst.create_items(conf_dict["plugin_data"][plugin_name])

            for target in container.get_targets():
                targets.append(target)
                target.do_snapshot()

    from lvm.models import LogicalVolume
    now = datetime.now().strftime("%Y%m%d-%H%M%S")

    for volume in LogicalVolume.objects.filter(id__in=conf_dict["volumes"]):
        volume.do_snapshot("%s_snapshot_%s" % (volume.name, now), snapshotconf=snapconf)

    for target in targets:
        target.delete_snapshot()

    if len(conf_dict["data"]["postscript"]) > 0:
        invoke(shlex.split(conf_dict["data"]["postscript"]))

class Container(object):
    def __init__(self, data, model_instance):
        self.data           = data
        self.children       = []
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
        self.data           = data
        self.model_instance = model_instance
        self.snapshot_state = None

    def do_snapshot(self):
        self.snapshot_state = self.model_instance.do_snapshot(self.data)

    def delete_snapshot(self):
        if self.snapshot_state is not None:
            self.model_instance.delete_snapshot(self.snapshot_state)

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

    def restore_config(self, snapconf):
        conf_dict = {}
        def _get_conf_obj(target_obj, modelstack):
            # modelstack enhaelt alle objektklassen UEBER target_obj, NICHT die von target_obj selbst
            if not modelstack:
                # target_obj isn Host, also conf_dict[host] anlegen und return
                if target_obj.id not in conf_dict:
                    conf_dict[target_obj.id] = {
                        "data": {},
                        "children": {}
                    }
                return conf_dict[target_obj.id]
            else:
                if isinstance(modelstack[-1], tuple):
                    containermodel, containerconfmodel = modelstack[-1]
                else:
                    containermodel = modelstack[-1]
                cnt = _get_conf_obj(self.find_foreign_object(target_obj, containermodel), modelstack[:-1])
                if target_obj.name not in cnt["children"]:
                    cnt["children"][target_obj.name] = {
                        "data": {},
                        "children": {}
                    }
                return cnt["children"][target_obj.name]

        def _populate_conf(modelstack):
            if not modelstack:
                return
            if isinstance(modelstack[-1], tuple):
                objmodel, confmodel = modelstack[-1]
                for target_conf in self.find_relation(snapconf, confmodel).all():
                    target_obj = self.find_foreign_object(target_conf, objmodel)
                    cnt = _get_conf_obj(target_obj, modelstack[:-1])
                    cnt["data"].update({"consistency": target_conf.consistency})
            _populate_conf(modelstack[:-1])

        _populate_conf(self.models)
        return {self.plugin_name: {"children": conf_dict, "data": {}}}

    def save_config(self, conf_dict, snapconf):
        def _save_items(confobj, model_instance, confmodel, modelstack):
            if confmodel is not None:
                if confobj["data"] is not None and "consistency" in confobj["data"] and confobj["data"]["consistency"]:
                    conf_rel_obj = self.find_relation(model_instance, confmodel)
                    conf_instance = conf_rel_obj.get_or_create(snapshot_conf=snapconf)[0]
                    conf_instance.consistency = confobj["data"]["consistency"]
                    conf_instance.save()

            if "children" in confobj and confobj["children"]:
                if isinstance(modelstack[0], tuple):
                    child_model, child_conf_model = modelstack[0]
                else:
                    child_model = modelstack[0]
                    child_conf_model = None

                rel_obj = self.find_relation(model_instance, child_model)

                for child_id, child_conf in confobj["children"].items():
                    child_instance, _ = rel_obj.get_or_create(name=child_id)
                    _save_items(child_conf, child_instance, child_conf_model, modelstack[1:])

        for host_id, host_conf in conf_dict['children'].items():
            host_model = self.models[0].objects.get(id=host_id)
            _save_items(host_conf, host_model, None, self.models[1:])

        return True

    def create_items(self, conf_dict):
        def _create_subitem(confobj, model_instance, parent, modelstack):
            merged_data = parent.data.copy()

            if confobj["data"]:
                merged_data.update(confobj["data"])

            if modelstack:
                obj = Container(merged_data, model_instance)
                parent.children.append(obj)

                if isinstance(modelstack[0], tuple):
                    child_model, _ = modelstack[0]
                else:
                    child_model = modelstack[0]

                rel_obj = self.find_relation(model_instance, child_model)

                if len(modelstack) == 1:
                    child_conf = model_instance.get_complete_childlist(confobj["children"], merged_data)
                else:
                    child_conf = confobj["children"]

                for child_id, child_conf in child_conf.items():
                    child_instance, _ = rel_obj.get_or_create(name=child_id)
                    _create_subitem(child_conf, child_instance, obj, modelstack[1:])
            else:
                obj = Target(merged_data, model_instance)
                parent.children.append(obj)

        plugindata = Container({}, None)

        for host_id, host_conf in conf_dict['children'].items():
            host_model = self.models[0].objects.get(id=host_id)
            _create_subitem(host_conf, host_model, plugindata, self.models[1:])

        return plugindata

    def find_foreign_object(self, obj, rel_model):
        for field in obj._meta.fields:
            if isinstance(field, models.ForeignKey) and get_related_model(field) == rel_model:
                return getattr(obj, field.name)
        raise KeyError("No foreignkey from '%r' to '%r' found!" % (obj, rel_model))

    def find_relation(self, obj, rel_model):
        for related in obj._meta.get_all_related_objects():
            if related.model == rel_model:
                return getattr(obj, related.get_accessor_name())
        raise KeyError("No relation from '%r' to '%r' found!" % (obj, rel_model))
