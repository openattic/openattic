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
import json
import logging
import re

from django.db import models
from django.core.exceptions import ValidationError

try:
    from ceph_nfs.cephfs_util import CephFSUtil
except ImportError:
    CephFSUtil = None
from ceph_nfs.tasks import async_deploy_exports
from ceph.models import CephCluster
from ceph_radosgw.rgw_client import RGWClient
from deepsea import DeepSea
from nodb.models import JsonField, NodbModel
from rest_client import RequestException
from systemd import get_dbus_object


logger = logging.getLogger(__name__)


class GaneshaExport(NodbModel):
    ACCESS_TYPE_CHOICES = (
        ('RW', 'RW'),
        ('RO', 'RO'),
        ('MDONLY', 'MDONLY'),
        ('MDONLY_RO', 'MDONLY_RO'),
        ('NONE', 'NONE')
    )
    SQUASH_CHOICES = (
        ('None', 'None'),
        ('Root', 'None'),
        ('All', 'All')
    )
    FSAL_CHOICES = (
        ('CEPH', 'CEPH'),
        ('RGW', 'RGW')
    )
    id = models.CharField(max_length=260, primary_key=True, null=False, blank=True)
    exportId = models.IntegerField(null=False, blank=True)
    host = models.CharField(max_length=128, null=False, blank=False)
    path = models.TextField(null=False, blank=False)
    pseudo = models.CharField(max_length=250, null=True, blank=True)
    tag = models.CharField(max_length=128, null=True, blank=True)
    accessType = models.CharField(max_length=9, choices=ACCESS_TYPE_CHOICES, null=True, blank=True,
                                  default='None')
    squash = models.CharField(max_length=4, choices=SQUASH_CHOICES, null=True, blank=True,
                              default='Root')
    protocols = JsonField(base_type=list, null=False, blank=False)
    transports = JsonField(base_type=list, null=False, blank=False)
    fsal = models.CharField(max_length=4, choices=FSAL_CHOICES, null=True, blank=True)
    rgwUserId = models.CharField(max_length=128, null=True, blank=True)
    clientBlocks = JsonField(base_type=list, null=True, blank=True)

    @staticmethod
    def get_all_objects(context, query):

        # currently context.fsid will be ignored because DeepSea still
        # does not support multiple Ceph clusters

        def default(dic, key, def_val):
            val = dic[key] if key in dic else def_val
            if isinstance(def_val, list) and not isinstance(val, list):
                val = [val]
            return val

        def preprocess_client_blocks(client_blocks):
            nblocks = []
            for client_block in client_blocks:
                client = {}
                for key, val in client_block.items():
                    if key.lower() == 'access_type':
                        client['accessType'] = val
                    elif key.lower() == 'clients':
                        client['clients'] = default(client_block, 'clients', [])
                    else:
                        client[key] = val
                nblocks.append(client)
            return nblocks

        host_exports = DeepSea.instance().nfs_get_exports()
        exports = []
        for host_export in host_exports:
            for exp in host_export['exports']:

                exports.append({
                    'id': '{}:{}'.format(host_export['host'], exp['export_id']),
                    'exportId': exp['export_id'],
                    'host': host_export['host'],
                    'path': exp['path'],
                    'pseudo': default(exp, 'pseudo', None),
                    'tag': default(exp, 'tag', None),
                    'accessType': default(exp, 'access_type', 'None'),
                    'squash': default(exp, 'squash', 'Root'),
                    'protocols': [
                        "NFSv{}".format(p) for p in default(exp, 'protocols', [3, 4])],
                    'transports': default(exp, 'transports', ['UDP', 'TCP']),
                    'fsal': exp['fsal']['name'],
                    'rgwUserId': exp['fsal']['user_id'] if exp['fsal']['name'] == 'RGW' else None,
                    'clientBlocks': preprocess_client_blocks(default(exp, 'client_blocks', []))
                })
        return [GaneshaExport(**GaneshaExport.make_model_args(e)) for e in exports]

    def _validate(self, exports, cluster):
        if self.fsal == 'CEPH':
            path_regex = r'^/[^><|&()?]*$'
        elif self.fsal == 'RGW':
            path_regex = r'^[^/><|&()#?]+$'
        else:
            path_regex = r'.*'
        match = re.match(path_regex, self.path)
        if not match:
            raise ValidationError("Export path ({}) is invalid.".format(self.path))

        if not self.protocols:
            raise ValidationError("No NFS protocol version specified for the export.")

        for p in self.protocols:
            match = re.match(r'^NFSv3$|^NFSv4$', p)
            if not match:
                raise ValidationError("'{}' is an invalid NFS protocol version identifier"
                                      .format(p))

        if not self.transports:
            raise Exception("No network transport type specified for the export.")

        for t in self.transports:
            match = re.match(r'^TCP$|^UDP$', t)
            if not match:
                raise ValidationError("'{}' is an invalid network transport type identifier"
                                      .format(t))

        if self.fsal == "RGW":
            if not self.rgwUserId:
                raise ValidationError('RGW user must be specified')

        if 'NFSv4' in self.protocols:
            if not hasattr(self, 'pseudo') or not self.pseudo:
                raise ValidationError("Pseudo path is required when NFSv4 protocol is used")
            match = re.match(r'^/[^><|&()]*$', self.pseudo)
            if not match:
                raise ValidationError("Export pseudo path ({}) is invalid".format(self.pseudo))

            len_prefix = 1
            parent_export = None
            for export in exports:
                def rts(path):
                    if not path:
                        return path
                    return path[:-1] if path[-1] == '/' and len(path) > 1 else path

                if self.pseudo and rts(export.pseudo) == rts(self.pseudo):
                    raise ValidationError("Another export exists with the same pseudo path: {}"
                                          .format(self.pseudo))

                if not export.pseudo:
                    continue

                if self.pseudo[:self.pseudo.rfind('/')+1].startswith(rts(export.pseudo)):
                    if self.pseudo[len(rts(export.pseudo))] == '/':
                        if len(rts(export.pseudo)) > len_prefix:
                            len_prefix = len(rts(export.pseudo))
                            parent_export = export

            if len_prefix > 1:
                # validate pseudo path
                idx = len(rts(parent_export.pseudo))
                idx = idx + 1 if idx > 1 else idx
                real_path = "{}/{}".format(parent_export.path
                                           if len(parent_export.path) > 1 else "",
                                           self.pseudo[idx:])
                if self.fsal == 'CEPH':
                    if self.path != real_path and \
                       not CephFSUtil.instance(cluster).dir_exists(real_path):
                        raise ValidationError("Pseudo path ({}) invalid, path {} does not exist."
                                              .format(self.pseudo, real_path))

        if self.tag:
            match = re.match(r'^[^/><|:&()]+$', self.tag)
            if not match:
                raise ValidationError("Export tag ({}) is invalid".format(self.tag))

            for export in exports:
                if self.tag and export.tag == self.tag:
                    raise ValidationError("Another export exists with the same tag: {}"
                                          .format(self.tag))

        if self.fsal == 'RGW' and 'NFSv4' not in self.protocols and not self.tag:
            raise ValidationError("Tag is mandatory for RGW export when using only NFSv3")

    @staticmethod
    def _gen_export_id(exports):
        exports = sorted(exports, key=lambda e: e.exportId)
        nid = 1
        for e in exports:
            if e.exportId == nid:
                nid += 1
            else:
                break
        return nid

    @staticmethod
    def save_exports(export_models, empty_hosts):
        try:
            rgw_is_online = RGWClient.admin_instance().is_service_online()
        except (RGWClient.NoCredentialsException, RequestException):
            rgw_is_online = False
        for e in export_models:
            # fetch keys for all RGW exports
            if e.fsal == 'RGW' and rgw_is_online:
                keys = RGWClient.admin_instance().get_user_keys(e.rgwUserId)
                setattr(e, 'rgwAccessKey', keys['access_key'])
                setattr(e, 'rgwSecretKey', keys['secret_key'])

        hosts_exports = []
        export_ids = []
        for e in export_models:
            export_ids.append(e.id)
            host_exports_list = [ht for ht in hosts_exports if ht['host'] == e.host]
            if not host_exports_list:
                host_exports_list = [{'host': e.host, 'exports':[]}]
                hosts_exports.append(host_exports_list[0])
            exports = host_exports_list[0]['exports']
            export = {
                'export_id': e.exportId,
                'path': e.path,
                'pseudo': e.pseudo,
                'tag': e.tag,
                'access_type': e.accessType,
                'squash': e.squash,
                'protocols': [int(p[4:]) for p in e.protocols],
                'transports': e.transports,
                'fsal': {
                    'name': e.fsal
                },
                'client_blocks': e.clientBlocks if e.clientBlocks else []
            }
            for client_block in export['client_blocks']:
                if 'accessType' in client_block:
                    client_block['access_type'] = client_block['accessType']
                    client_block.pop('accessType')
            if e.fsal == 'RGW':
                # get userId RGW credentials from rgw module
                export['fsal']['user_id'] = e.rgwUserId
                if hasattr(e, 'rgwAccessKey') and hasattr(e, 'rgwSecretKey'):
                    export['fsal']['access_key_id'] = e.rgwAccessKey
                    export['fsal']['secret_access_key'] = e.rgwSecretKey
            exports.append(export)

        for host in empty_hosts:
            hosts_exports.append({'host': host, 'exports':[]})

        result = DeepSea.instance().nfs_save_exports(json.dumps(hosts_exports))
        if not result['success']:
            logger.error("Error saving NFS-Ganesha exports: %s", result['message'])
            raise Exception('DeepSea Error: saving NFS-Ganesha exports\n{}'
                            .format(result['message']))
        else:
            logger.info("NFS Ganesha exports saved successfully: %s", export_ids)

    def save(self, force_insert=False, force_update=False, using=None,
             update_fields=None):

        context = GaneshaExport.objects.nodb_context
        cluster = context.cluster

        self.path = self.path.strip()
        if self.fsal == 'CEPH' and self.path[-1] == '/' and len(self.path) > 1:
            self.path = self.path[:-1]

        export_models = [e for e in self.__class__.objects.all()]

        if hasattr(self, 'id'):
            export_models = [e for e in export_models if e.id != self.id]

        self._validate([e for e in export_models if e.host == self.host], cluster)

        try:
            rgw_is_online = RGWClient.admin_instance().is_service_online()
        except (RGWClient.NoCredentialsException, RequestException):
            rgw_is_online = False
        if self.fsal == 'RGW' and not rgw_is_online:
            raise Exception("RGW REST service is not online, please check if service is running "
                            "and openATTIC configuration settings")

        if self.fsal == 'CEPH' and not CephFSUtil.instance(cluster).dir_exists(self.path):
            cephfs = get_dbus_object("/cephfs")
            cephfs.cephfs_mkdirs(cluster.fsid, self.path)
        elif self.fsal == 'RGW':
            rgw = RGWClient.instance(self.rgwUserId)
            try:
                exists = rgw.bucket_exists(self.path, self.rgwUserId)
                logger.debug('Checking existence of RGW bucket "%s" for user "%s": %s', self.path,
                             self.rgwUserId, exists)
            except RequestException as exp:
                if exp.status_code == 403:
                    raise Exception('Bucket "{}" already exists, and belongs to other user.'
                                    .format(self.path))
                else:
                    raise exp
            if not exists:
                logger.info('Creating new RGW bucket "%s" for user "%s"', self.path, self.rgwUserId)
                rgw.create_bucket(self.path)

        if not hasattr(self, 'exportId'):
            # new export case
            setattr(self, 'exportId', GaneshaExport._gen_export_id(
                [e for e in export_models if e.host == self.host]))
            setattr(self, 'id', '{}:{}'.format(self.host, self.exportId))
            logger.info("Creating new export host=%s exportId=%s path=%s", self.id, self.exportId,
                        self.path)
        else:
            # update export case
            # update id and exportId due to host change
            if self.id.split(':')[0] != self.host:
                self.exportId = GaneshaExport._gen_export_id(
                    [e for e in export_models if e.host == self.host])
                self.id = '{}:{}'.format(self.host, self.exportId)

        status = DeepSea.instance().nfs_status_exports()
        GaneshaExport.save_exports(export_models + [self], [])
        if status[self.host]['active']:
            async_deploy_exports.delay(self.host)

        super(GaneshaExport, self).save(force_insert, force_update, using, update_fields)
