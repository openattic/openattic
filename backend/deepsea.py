# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

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
from django.conf import settings
from utilities import aggregate_dict, zip_by_keys
from rest_client import RestClient, RequestException

logger = logging.getLogger(__name__)


class DeepSea(RestClient):
    _instance = None

    @staticmethod
    def instance():
        if DeepSea._instance is None:
            DeepSea._instance = DeepSea()
        return DeepSea._instance

    def __init__(self):
        super(DeepSea, self).__init__(settings.SALT_API_HOST, settings.SALT_API_PORT, 'Salt')
        self.token = None

    def _is_logged_in(self):
        return self.token is not None

    def _reset_login(self):
        self.token = None

    @RestClient.api_get('/', resp_structure='return')
    def is_service_online(self, request=None):
        try:
            response = request()
            return response['return'] == 'Welcome'
        except RequestException:
            return False

    @RestClient.api_post('/login', resp_structure='return[0] > token')
    def _login(self, request=None):
        response = request({
            'username': settings.SALT_API_USERNAME,
            'password': settings.SALT_API_PASSWORD,
            'eauth': settings.SALT_API_EAUTH
        })
        self.token = response['return'][0]['token']
        self.headers['X-Auth-Token'] = self.token
        logger.info("Salt API login successful")

    @RestClient.api_get('/keys', resp_structure='return > (minions_pre[*] & minions_denied[*] &'
                                                '          minions_rejected[*] & minions[*])')
    @RestClient.requires_login
    def key_list(self, request=None):
        """
        Returns the status of keys for all minions

        Equivalent to run:
        $ salt-key -L
        """
        response = request()
        return response['return']

    @RestClient.api_post('/', resp_structure='return[0] >> (roles[*] & ?public_address &'
                                             '              public_network & cluster_network &'
                                             '              fsid & mon_host[*] &'
                                             '              mon_initial_members[*])')
    @RestClient.requires_login
    def pillar_items(self, request=None):
        """
        Returns the pillar items for all minions

        Equivalent to run:
        $ salt '*' pillar.items
        """
        response = request({
            'client': 'local', 'tgt': '*', 'fun': 'pillar.items'
        })
        res = {}
        for obj in response['return']:
            for key in obj:
                res[key] = obj[key]
        return res

    def get_minions(self):
        keys = self.key_list()

        key_aggr = list()
        for key in keys:
            if key == 'minions_pre':
                key_status = 'unaccepted'
            elif key == 'minions_rejected':
                key_status = 'rejected'
            elif key == 'minions_denied':
                key_status = 'denied'
            elif key == 'minions':
                key_status = 'accepted'
            else:
                continue

            key_aggr.extend([{'hostname': hostname, 'key_status': key_status}
                             for hostname in keys[key]])

        out = self.pillar_items()
        minions = [aggregate_dict(data, hostname=hostname) for (hostname, data) in out.iteritems()]
        minions = zip_by_keys(('hostname', key_aggr), ('hostname', minions))
        return minions

    @RestClient.api_post('/', resp_structure='return[0] > *')
    @RestClient.requires_login
    def iscsi_interfaces(self, request=None):
        response = request({
            'client': 'runner', 'fun': 'ui_iscsi.interfaces'
        })
        interfaces = response['return'][0]
        return [{'hostname': k, 'interfaces': v} for k, v in interfaces.items()]

    @RestClient.api_post('/', resp_structure='return[0] > (?pools[*] & ?portals[*] & ?targets[*] '
                                             '& ?auth[*])')
    @RestClient.requires_login
    def iscsi_config(self, request=None):
        response = request({
            'client': 'runner', 'fun': 'ui_iscsi.config'
        })
        return response['return'][0]

    @RestClient.api_post('/')
    @RestClient.requires_login
    def iscsi_save(self, lrbd_json, request='return[*]'):
        response = request({
            'client': 'runner', 'fun': 'ui_iscsi.save', 'data': lrbd_json
        })
        return response['return'][0] is None

    @RestClient.api_post('/', resp_structure='return[0]')
    @RestClient.requires_login
    def iscsi_status(self, request=None):
        response = request({
            'client': 'runner', 'fun': 'ui_iscsi.status'
        })
        return response['return'][0]

    @RestClient.api_post('/', resp_structure='return[0]')
    @RestClient.requires_login
    def iscsi_deploy(self, request=None):
        response = request({
            'client': 'runner', 'fun': 'ui_iscsi.deploy'
        })
        return response['return'][0]

    @RestClient.api_post('/', resp_structure='return[0]')
    @RestClient.requires_login
    def iscsi_undeploy(self, request=None):
        response = request({
            'client': 'runner', 'fun': 'ui_iscsi.undeploy'
        })
        return response['return'][0]
