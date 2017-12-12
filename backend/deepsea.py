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
from __future__ import absolute_import
import logging
from urlparse import urlparse
from oa_settings import Settings, SettingsListener
from utilities import aggregate_dict, zip_by_keys
from rest_client import RestClient

logger = logging.getLogger(__name__)


class DeepSea(RestClient, SettingsListener):
    _instance = None

    @staticmethod
    def instance():
        if DeepSea._instance is None:
            if Settings.SALT_API_EAUTH == 'sharedsecret':
                password = Settings.SALT_API_SHARED_SECRET
            else:
                password = Settings.SALT_API_PASSWORD
            DeepSea._instance = DeepSea(Settings.SALT_API_HOST, Settings.SALT_API_PORT,
                                        Settings.SALT_API_EAUTH, Settings.SALT_API_USERNAME,
                                        password)
        return DeepSea._instance

    def __init__(self, host, port, eauth, username, password):
        super(DeepSea, self).__init__(host, port, 'Salt')
        self.eauth = eauth
        self.username = username
        self.password = password
        self.token = None

    def _is_logged_in(self):
        return self.token is not None

    def _reset_login(self):
        self.token = None

    def settings_changed_handler(self):
        logger.debug("DeepSea was notified that settings changed!")
        DeepSea._instance = None

    def is_configured(self):
        return all((self.host, self.port, self.eauth, self.username, self.password))

    @RestClient.api_get('/', resp_structure='return')
    @RestClient.requires_login
    def is_service_online(self, request=None):
        response = request()
        return response['return'] == 'Welcome'

    @RestClient.api_post('/login', resp_structure='return[0] > token')
    def _login(self, request=None):
        response = request({
            'username': self.username,
            'sharedsecret' if self.eauth == 'sharedsecret' else 'password': self.password,
            'eauth': self.eauth
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

    @RestClient.api_post('/', resp_structure='return[0] >> (?roles[*] & ?public_network & '
                                             '              ?cluster_network & ?fsid)')
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

    @RestClient.api_post('/', resp_structure='return[*]')
    @RestClient.requires_login
    def iscsi_save(self, lrbd_json, request=None):
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

    @RestClient.api_post('/', resp_structure='return[0] > (success & minions)')
    @RestClient.requires_login
    def iscsi_deploy(self, minions=None, request=None):
        if minions is None:
            minions = []
        response = request({
            'client': 'runner', 'fun': 'ui_iscsi.deploy', 'minions': ','.join(minions)
        })
        return response['return'][0]

    @RestClient.api_post('/', resp_structure='return[0]')
    @RestClient.requires_login
    def iscsi_undeploy(self, minions=None, request=None):
        if minions is None:
            minions = []
        response = request({
            'client': 'runner', 'fun': 'ui_iscsi.undeploy', 'minions': ','.join(minions)
        })
        return response['return'][0]

    @RestClient.api_post('/', resp_structure='return[0] > (urls[+] & access_key & secret_key &'
                                             '             user_id & success)')
    @RestClient.requires_login
    def get_rgw_api_credentials(self, request=None):
        response = request({'client': 'runner', 'fun': 'ui_rgw.credentials'})
        response_json = response['return'][0]
        if not response_json['success']:
            return None
        parsed_url = urlparse(response_json['urls'][0])  # Uses the first returned host

        if not parsed_url.path or parsed_url.path == '/':
            admin_path = 'admin'
        else:
            admin_path = parsed_url.path[1:]
        return {
            'scheme': parsed_url.scheme,
            'host': parsed_url.hostname,
            'port': parsed_url.port,
            'admin_path': admin_path,
            'access_key': response_json['access_key'],
            'secret_key': response_json['secret_key'],
            'user_id': response_json['user_id']
        }

    @RestClient.api_post('/', resp_structure='return[0][*] > (host & exports[*] > (export_id'
                                             '& path & ?pseudo & ?access_type & fsal > name)')
    @RestClient.requires_login
    def nfs_get_exports(self, request=None):
        response = request({
            'client': 'runner', 'fun': 'ui_ganesha.get_exports'
        })
        return response['return'][0]

    @RestClient.api_post('/', resp_structure='return[0] > (success & ?message)')
    @RestClient.requires_login
    def nfs_save_exports(self, exports, request=None):
        response = request({
            'client': 'runner', 'fun': 'ui_ganesha.save_exports', 'exports': exports
        })
        return response['return'][0]

    @RestClient.api_post('/', resp_structure='return[0][*]')
    @RestClient.requires_login
    def nfs_get_hosts(self, request=None):
        response = request({
            'client': 'runner', 'fun': 'ui_ganesha.get_hosts'
        })
        return response['return'][0]

    @RestClient.api_post('/', resp_structure='return[0][*]')
    @RestClient.requires_login
    def nfs_get_fsals_available(self, request=None):
        response = request({
            'client': 'runner', 'fun': 'ui_ganesha.get_fsals_available'
        })
        return response['return'][0]

    @RestClient.api_post('/')
    @RestClient.requires_login
    def nfs_deploy_exports(self, minion=None, request=None):
        request({
            'client': 'runner', 'fun': 'ui_ganesha.deploy_exports', 'minion': minion
        })

    @RestClient.api_post('/', resp_structure='return[0] >> (active & ?message & ?exports)')
    @RestClient.requires_login
    def nfs_status_exports(self, request=None):
        response = request({
            'client': 'runner', 'fun': 'ui_ganesha.status_exports'
        })
        return response['return'][0]

    @RestClient.api_post('/', resp_structure='return[0]')
    @RestClient.requires_login
    def nfs_stop_exports(self, minion=None, request=None):
        response = request({
            'client': 'runner', 'fun': 'ui_ganesha.stop_exports', 'minion': minion
        })
        return response['return'][0]

    @RestClient.api_post('/', resp_structure='return[0]')
    @RestClient.requires_login
    def get_deepsea_version(self, request=None):
        response = request({
            'client': 'runner', 'fun': 'deepsea.version', 'format': 'json'
        })
        return response['return'][0]
