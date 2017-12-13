# -*- coding: utf-8 -*-
"""
 *   Copyright (c) 2017 SUSE LLC
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

from django.db import models

from ceph_iscsi import tasks
from nodb.models import NodbModel, JsonField
from deepsea import DeepSea
from ceph_iscsi.lrbd_conf import LRBDConf, LRBDUi


logger = logging.getLogger(__name__)


class iSCSIInterface(NodbModel):
    hostname = models.CharField(max_length=250, primary_key=True, editable=False)
    interfaces = JsonField(base_type=list, editable=False, null=True, blank=True)

    @staticmethod
    def get_all_objects(context, query):

        # currently context.fsid will be ignored because DeepSea still
        # does not support multiple Ceph clusters

        interfaces = DeepSea.instance().iscsi_interfaces()
        return [iSCSIInterface(**iSCSIInterface.make_model_args(i)) for i in interfaces]


class iSCSITarget(NodbModel):
    targetId = models.CharField(max_length=120, primary_key=True, editable=True)
    newTargetId = models.CharField(max_length=120, editable=True, null=True, blank=True)
    targetSettings = JsonField(base_type=object, editable=True, null=True, blank=True)
    portals = JsonField(base_type=list, editable=True, null=False, blank=False)
    images = JsonField(base_type=list, editable=True, null=False, blank=False)
    authentication = JsonField(base_type=object, editable=True, null=True, blank=True)

    @staticmethod
    def get_all_objects(context, query):
        # currently context.fsid will be ignored because DeepSea still
        # does not support multiple Ceph clusters

        config = DeepSea.instance().iscsi_config()
        targets = [t.to_ui_dict() for t in LRBDConf(config).targets()]
        for t in targets:
            t['newTargetId'] = None
        targets = [iSCSITarget(**iSCSITarget.make_model_args(t)) for t in targets]

        return targets

    @staticmethod
    def extract_hostnames(portals):
        return set(map(lambda portal: portal['hostname'], portals))

    def _validate(self):
        luns = set()
        uuids = set()
        for i in self.images:
            # validate LUN assignments
            if 'settings' in i and 'lun' in i['settings']:
                if i['settings']['lun'] in luns:
                    raise Exception('Cannot use same LUN id for two different images')
                luns.add(i['settings']['lun'])

            # validate UUID assignments
            if 'settings' in i and 'uuid' in i['settings']:
                if i['settings']['uuid'] in uuids:
                    raise Exception('Cannot use same UUID for two different images')
                uuids.add(i['settings']['uuid'])

    def save(self, force_insert=False, force_update=False, using=None,
             update_fields=None):

        self._validate()

        targets = []
        old_target = None
        for target in self.__class__.objects.all():
            if target.targetId == self.targetId:
                old_target = target
                continue
            targets.append(target)
        if self.newTargetId and self.newTargetId != self.targetId:
            same_target_id = [t for t in targets if t.targetId == self.newTargetId]
            if same_target_id:
                raise Exception('Target ID: "{}" already exists'.format(self.target_id))
            self.targetId = self.newTargetId

        targets.append(self)
        lrbd = LRBDUi(targets)
        if DeepSea.instance().iscsi_save(lrbd.lrbd_conf_json()):
            logger.info("Saved iSCSI Targets:\n%s", [t.targetId for t in targets])
        else:
            logger.info("Failed to save iSCSI Targets")

        status = DeepSea.instance().iscsi_status()
        if status:
            minions = iSCSITarget.extract_hostnames(self.portals)
            if old_target:
                minions = minions.union(iSCSITarget.extract_hostnames(old_target.portals))
            task = tasks.async_deploy_exports.delay(list(minions))
            logger.info("Scheduled deploy of iSCSI exports: taskqueue_id=%s", task.id)

        super(iSCSITarget, self).save(force_insert, force_update, using, update_fields)
