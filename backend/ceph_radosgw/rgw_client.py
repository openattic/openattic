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
from oa_settings import Settings, SettingsListener
from deepsea import DeepSea
from rest_client import RestClient, RequestException

logger = logging.getLogger(__name__)


class RGWClient(RestClient, SettingsListener):
    _SYSTEM_USERID = None
    _ADMIN_PATH = None
    _host = None
    _port = None
    _ssl = None
    _user_instances = {}

    class NoCredentialsException(Exception):
        def __init__(self):
            super(RGWClient.NoCredentialsException, self).__init__('No RGW credentials found')

    @staticmethod
    def _load_settings():
        if all((Settings.RGW_API_HOST, Settings.RGW_API_PORT, Settings.RGW_API_SCHEME,
                Settings.RGW_API_ADMIN_RESOURCE, Settings.RGW_API_USER_ID,
                Settings.RGW_API_ACCESS_KEY, Settings.RGW_API_SECRET_KEY)):
            logger.info("Using local RGW settings to connect to RGW REST API")
            credentials = {
                'host': Settings.RGW_API_HOST,
                'port': Settings.RGW_API_PORT,
                'scheme': Settings.RGW_API_SCHEME,
                'admin_path': Settings.RGW_API_ADMIN_RESOURCE,
                'user_id': Settings.RGW_API_USER_ID,
                'access_key': Settings.RGW_API_ACCESS_KEY,
                'secret_key': Settings.RGW_API_SECRET_KEY
            }
        else:
            try:
                credentials = DeepSea.instance().get_rgw_api_credentials()
                if not credentials:
                    logger.error("DeepSea failed to give the credentials info.")
                    raise RGWClient.NoCredentialsException()
                logger.info("Using DeepSea RGW settings to connect to RGW REST API")
            except RequestException as e:
                logger.exception(e)
                raise RGWClient.NoCredentialsException()

        RGWClient._host = credentials['host']
        RGWClient._port = credentials['port']
        RGWClient._ssl = credentials['scheme'] == 'https'
        logger.info("Creating new connection for user: %s", credentials['user_id'])
        RGWClient._ADMIN_PATH = credentials['admin_path']
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
            if not keys:
                raise Exception("User '{}' does not have any keys configured.".format(userid))

            RGWClient._user_instances[userid] = RGWClient(userid, keys['access_key'],
                                                          keys['secret_key'])
        return RGWClient._user_instances[userid]

    @staticmethod
    def admin_instance():
        return RGWClient.instance(RGWClient._SYSTEM_USERID)

    def __init__(self, userid, access_key, secret_key, host=None, port=None, admin_path=None,
                 ssl=False):
        if not host and not RGWClient._host:
            RGWClient._load_settings()
        host = host if host else RGWClient._host
        port = port if port else RGWClient._port
        admin_path = admin_path if admin_path else RGWClient._ADMIN_PATH
        ssl = ssl if ssl else RGWClient._ssl

        self.userid = userid
        self.service_url = '{}:{}'.format(host, port)
        self.admin_path = admin_path

        s3auth = S3Auth(access_key, secret_key, service_url=self.service_url)
        super(RGWClient, self).__init__(host, port, 'RGW', ssl, s3auth)

    def _reset_login(self):
        if self.userid != RGWClient._SYSTEM_USERID:
            logger.info("Fetching new keys for user: %s", self.userid)
            keys = RGWClient.admin_instance().get_user_keys(self.userid)
            self.auth = S3Auth(keys['access_key'], keys['secret_key'],
                               service_url=self.service_url)
        else:
            raise RequestException('Authentication failed for the "{}" user: wrong credentials'
                                   .format(self.userid), status_code=401)

    def settings_changed_handler(self):
        logger.debug("RGW Client was notified that settings changed!")
        RGWClient._user_instances = {}

    @RestClient.requires_login
    @RestClient.api_get('/', resp_structure='[0] > ID')
    def is_service_online(self, request=None):
        response = request({
            'format': 'json'
        })
        return response[0]['ID'] == self.userid

    @RestClient.requires_login
    @RestClient.api_get('/{admin_path}/metadata/user', resp_structure='[+]')
    def _is_system_user(self, admin_path, request=None):
        response = request()
        return self.userid in response

    def is_system_user(self):
        return self._is_system_user(self.admin_path)

    @RestClient.requires_login
    @RestClient.api_get('/{admin_path}/user', resp_structure='tenant & user_id & email & keys[*] > '
                                                             ' (user & access_key & secret_key)')
    def _admin_get_user_keys(self, admin_path, userid, request=None):
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
        return self._admin_get_user_keys(self.admin_path, userid)

    @RestClient.requires_login
    @RestClient.api('/{admin_path}/{path}')
    def _proxy_request(self, admin_path, path, method, params, data, request=None):
        return request(method=method, params=params, data=data, raw_content=True)

    def proxy(self, method, path, params, data):
        logger.debug("proxying method=%s path=%s params=%s data=%s", method, path, params, data)
        return self._proxy_request(self.admin_path, path, method, params, data)

    @RestClient.requires_login
    @RestClient.api_get('/', resp_structure='[1][*] > Name')
    def get_buckets(self, request=None):
        """
        Get a list of names from all existing buckets of this user.
        :return: Returns a list of bucket names.
        """
        response = request({
            'format': 'json'
        })
        return [bucket['Name'] for bucket in response[1]]

    @RestClient.requires_login
    @RestClient.api_get('/{bucket_name}')
    def bucket_exists(self, bucket_name, userid, request=None):
        """
        Check if the specified bucket exists for this user.
        :param bucket_name: The name of the bucket.
        :return: Returns True if the bucket exists, otherwise False.
        """
        try:
            request()
            my_buckets = self.get_buckets()
            if bucket_name not in my_buckets:
                raise RequestException('Bucket "{}" belongs to other user'.format(bucket_name),
                                       403)
            return True
        except RequestException as e:
            if e.status_code == 404:
                return False
            else:
                raise e

    @RestClient.requires_login
    @RestClient.api_put('/{bucket_name}')
    def create_bucket(self, bucket_name, request=None):
        logger.info("Creating bucket: %s", bucket_name)
        return request()
