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

from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from oa_settings import Settings, save_settings
from deepsea import DeepSea
from rest_client import RequestException
from ceph_radosgw.rgw_client import RGWClient

logger = logging.getLogger(__name__)


class SettingsView(APIView):
    def get(self, request):
        rgw_host = Settings.RGW_API_HOST
        rgw_port = Settings.RGW_API_PORT
        rgw_access_key = Settings.RGW_API_ACCESS_KEY
        rgw_secret_key = Settings.RGW_API_SECRET_KEY
        rgw_user_id = Settings.RGW_API_ADMIN_RESOURCE
        rgw_use_ssl = Settings.RGW_API_SCHEME == 'https'
        managed_deepsea = False
        if not all((Settings.RGW_API_HOST, Settings.RGW_API_PORT, Settings.RGW_API_SCHEME,
                    Settings.RGW_API_ADMIN_RESOURCE, Settings.RGW_API_ACCESS_KEY,
                    Settings.RGW_API_SECRET_KEY)):
            try:
                credentials = DeepSea.instance().get_rgw_api_credentials()
                if credentials:
                    managed_deepsea = True
                    rgw_host = credentials['host']
                    rgw_port = credentials['port']
                    rgw_access_key = credentials['access_key']
                    rgw_secret_key = credentials['secret_key']
                    rgw_user_id = credentials['user_id']
                    rgw_use_ssl = credentials['scheme'] == 'https'
            except RequestException:
                pass

        return Response({
            "deepsea": {
                "host": Settings.SALT_API_HOST,
                "port": Settings.SALT_API_PORT,
                "eauth": Settings.SALT_API_EAUTH,
                "username": Settings.SALT_API_USERNAME,
                "password": Settings.SALT_API_PASSWORD,
                "shared_secret": Settings.SALT_API_SHARED_SECRET
            },
            "rgw": {
                "managed_by_deepsea": managed_deepsea,
                "host": rgw_host,
                "port": rgw_port,
                "access_key": rgw_access_key,
                "secret_key": rgw_secret_key,
                "user_id": rgw_user_id,
                "use_ssl": rgw_use_ssl
            }
        })

    def post(self, request):
        deepsea = request.DATA['deepsea']
        Settings.SALT_API_HOST = deepsea['host']
        Settings.SALT_API_PORT = deepsea['port']
        Settings.SALT_API_EAUTH = deepsea['eauth']
        Settings.SALT_API_USERNAME = deepsea['username']
        Settings.SALT_API_PASSWORD = deepsea['password']
        Settings.SALT_API_SHARED_SECRET = deepsea['shared_secret']

        rgw = request.DATA['rgw']
        if not rgw['managed_by_deepsea']:
            Settings.RGW_API_HOST = rgw['host']
            Settings.RGW_API_PORT = rgw['port']
            Settings.RGW_API_ACCESS_KEY = rgw['access_key']
            Settings.RGW_API_SECRET_KEY = rgw['secret_key']
            Settings.RGW_API_ADMIN_RESOURCE = rgw['user_id']
            Settings.RGW_API_SCHEME = 'https' if rgw['use_ssl'] else 'http'
        else:
            Settings.RGW_API_HOST = ''
            Settings.RGW_API_ACCESS_KEY = ''
            Settings.RGW_API_SECRET_KEY = ''

        save_settings()
        return Response({'success': True})


def _check_rest_client_connection(restclient):
    message = ''
    try:
        if restclient.is_service_online():
            return {'success': True}
        else:
            message = 'Connection successful but {} is not working properly.' \
                      .format(restclient.client_name)
    except RequestException as ex:
        if ex.status_code:
            if ex.status_code in [401, 403]:
                message = '{} Authentication Failed'.format(restclient.client_name)
            elif ex.status_code == 500:
                message = '{} Server Error'.format(restclient.client_name)
            else:
                message = '{} return HTTP code {}'.format(restclient.client_name, ex.status_code)
        else:
            message = 'Connection error: (errno {}) {}'.format(ex.conn_errno, ex.conn_strerror)
    except RGWClient.NoCredentialsException:
        return {'success': False,
                'message': '{} Authentication Failed'.format(restclient.client_name)}
    return {'success': False, 'message': message}


class CheckDeepSeaConnectionView(APIView):
    def get(self, request):
        if 'host' not in request.GET or \
           'port' not in request.GET or \
           'eauth' not in request.GET:
            raise ValidationError('"host", "port", and "eauth" params are required')

        if request.GET['eauth'] == 'auto' and \
           ('username' not in request.GET or 'password' not in request.GET):
            raise ValidationError('"username", and "password" params are required')

        if request.GET['eauth'] == 'sharedsecret' and \
           ('username' not in request.GET or 'shared_secret' not in request.GET):
            raise ValidationError('"username", and "shared_secret" params are required')

        password = request.GET['shared_secret'] \
            if request.GET['eauth'] == 'sharedsecret' else request.GET['password']
        deepsea = DeepSea(request.GET['host'], request.GET['port'], request.GET['eauth'],
                          request.GET['username'], password)
        return Response(_check_rest_client_connection(deepsea))


class CheckRGWConnectionView(APIView):
    def get(self, request):
        if 'user_id' not in request.GET or \
           'access_key' not in request.GET or \
           'secret_key' not in request.GET or \
           'host' not in request.GET or \
           'port' not in request.GET or \
           'use_ssl' not in request.GET:
            raise ValidationError('"host", "port", "user_id", "access_key", "secret_key", '
                                  'and "use_ssl" params are required')

        if not all((request.GET['user_id'], request.GET['access_key'], request.GET['secret_key'],
                    request.GET['host'], request.GET['port'], request.GET['use_ssl'])):
            return Response({'success': False, 'message': 'Configuration incomplete'})

        rgwclient = RGWClient(request.GET['user_id'], request.GET['access_key'],
                              request.GET['secret_key'], request.GET['host'],
                              request.GET['port'], request.GET['use_ssl'] == 'true')
        return Response(_check_rest_client_connection(rgwclient))


class GetRGWConfigurationView(APIView):
    def get(self, request):
        if 'host' not in request.GET or \
           'port' not in request.GET or \
           'eauth' not in request.GET:
            raise ValidationError('"host", "port", and "eauth" params are required')

        if request.GET['eauth'] == 'auto' and \
           ('username' not in request.GET or 'password' not in request.GET):
            raise ValidationError('"username", and "password" params are required')

        if request.GET['eauth'] == 'sharedsecret' and \
           ('username' not in request.GET or 'shared_secret' not in request.GET):
            raise ValidationError('"username", and "shared_secret" params are required')

        password = request.GET['shared_secret'] \
            if request.GET['eauth'] == 'sharedsecret' else request.GET['password']
        deepsea = DeepSea(request.GET['host'], request.GET['port'], request.GET['eauth'],
                          request.GET['username'], password)
        try:
            rgw_info = deepsea.get_rgw_api_credentials()
            if rgw_info:
                return Response({
                    "success": True,
                    "rgw": {
                        "host": rgw_info['host'],
                        "port": int(rgw_info['port']),
                        "access_key": rgw_info['access_key'],
                        "secret_key": rgw_info['secret_key'],
                        "user_id": rgw_info['user_id'],
                        "use_ssl": rgw_info['scheme'] == 'https'
                    }
                })
        except RequestException:
            pass
        return Response({'success': False})
