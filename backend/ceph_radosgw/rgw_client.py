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
from awsauth import S3Auth
from ceph_radosgw.conf import settings
from deepsea import DeepSea
from rest_client import RestClient, RequestException

logger = logging.getLogger(__name__)


class RGWClient(RestClient):
    _SYSTEM_USERID = None
    _host = None
    _port = None
    _ssl = None
    _user_instances = {}

    class NoCredentialsException(Exception):
        def __init__(self):
            super(RGWClient.NoCredentialsException, self).__init__('No RGW credentials found')

    @staticmethod
    def _load_settings():
        if all((settings.RGW_API_HOST, settings.RGW_API_PORT, settings.RGW_API_SCHEME,
                settings.RGW_API_ADMIN_RESOURCE, settings.RGW_API_ACCESS_KEY,
                settings.RGW_API_SECRET_KEY)):
            logger.info("Using local RGW settings to connect to RGW REST API")
            credentials = {
                'host': settings.RGW_API_HOST,
                'port': settings.RGW_API_PORT,
                'scheme': settings.RGW_API_SCHEME,
                'user_id': settings.RGW_API_ADMIN_RESOURCE,
                'access_key': settings.RGW_API_ACCESS_KEY,
                'secret_key': settings.RGW_API_SECRET_KEY
            }
        else:
            try:
                credentials = DeepSea.instance().get_rgw_api_credentials()
                if not credentials:
                    logger.error("DeepSea failed to give the credentials info.")
                    raise RGWClient.NoCredentialsException()
                logger.info("Using DeepSea RGW settings to connect to RGW REST API")
            except RequestException as e:
                logger.error(e)
                raise RGWClient.NoCredentialsException()

        RGWClient._host = credentials['host']
        RGWClient._port = credentials['port']
        RGWClient._ssl = credentials['scheme'] == 'https'
        logger.info("Creating new connection for user: %s", credentials['user_id'])
        RGWClient._SYSTEM_USERID = credentials['user_id']
        RGWClient._user_instances[RGWClient._SYSTEM_USERID] = RGWClient(credentials['user_id'],
                                                                        credentials['access_key'],
                                                                        credentials['secret_key'])

    @staticmethod
    def instance(userid):
        if not RGWClient._user_instances:
            RGWClient._load_settings()
        if not userid:
            userid = RGWClient._SYSTEM_USERID
        if userid not in RGWClient._user_instances:
            logger.info("Creating new connection for user: %s", userid)
            keys = RGWClient.admin_instance().get_user_keys(userid)
            RGWClient._user_instances[userid] = RGWClient(userid, keys['access_key'],
                                                          keys['secret_key'])
        return RGWClient._user_instances[userid]

    @staticmethod
    def admin_instance():
        return RGWClient.instance(RGWClient._SYSTEM_USERID)

    def __init__(self, userid, access_key, secret_key, host=None, port=None, ssl=False):
        if not RGWClient._host:
            RGWClient._load_settings()
        host = host if host else RGWClient._host
        port = port if port else RGWClient._port
        ssl = ssl if ssl else RGWClient._ssl

        self.userid = userid
        self.service_url = '{}:{}'.format(host, port)

        s3auth = S3Auth(access_key, secret_key, service_url=self.service_url)
        super(RGWClient, self).__init__(host, port, 'RGW', ssl, s3auth)

    def _reset_login(self):
        if self.userid != RGWClient._SYSTEM_USERID:
            logger.info("Fetching new keys for user: %s", self.userid)
            keys = RGWClient.admin_instance().get_user_keys(self.userid)
            self.auth = S3Auth(keys['access_key'], keys['secret_key'],
                               service_url=self.service_url)
        else:
            raise Exception('Authentication failed for the "{}" user: wrong credentials'
                            .format(self.userid))

    @RestClient.requires_login
    @RestClient.api_get('/', resp_structure='[0] > ID')
    def is_service_online(self, request=None):
        try:
            response = request({
                'format': 'json'
            })
            return response[0]['ID'] == self.userid
        except RequestException:
            return False

    @RestClient.requires_login
    @RestClient.api_get('/{sysuser}/user', resp_structure='tenant & user_id & email & keys[*] > '
                                                          ' (user & access_key & secret_key)')
    def _admin_get_user_keys(self, sysuser, userid, request=None):
        colon_idx = userid.find(':')
        user = userid if colon_idx == -1 else userid[:colon_idx]
        response = request({
            'uid': user
        })
        for keys in response['keys']:
            if keys['user'] == userid:
                return {
                    'access_key': keys['access_key'],
                    'secret_key': keys['secret_key']
                }

    def get_user_keys(self, userid):
        return self._admin_get_user_keys(RGWClient._SYSTEM_USERID, userid)

    @RestClient.requires_login
    @RestClient.api('/{sysuser}/{path}')
    def _proxy_request(self, sysuser, path, method, params, data, request=None):
        return request(method=method, params=params, data=data, raw_content=True)

    def proxy(self, method, path, params, data):
        logger.debug("proxying method=%s path=%s params=%s data=%s", method, path, params, data)
        return self._proxy_request(RGWClient._SYSTEM_USERID, path, method, params, data)

