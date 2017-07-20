# -*- coding: utf-8 -*-
"""
 *  Copyright (c) 2017 SUSE LLC
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

from django.http import HttpResponse
from rest_framework.views import APIView

from grafana.grafana_proxy import GrafanaProxy, get_grafana_api_response
from rest_client import RequestException


class ProxyView(APIView):
    def __getattr__(self, item):
        if item in ['get', 'post', 'put', 'delete']:
            return ProxyView.proxy_view

    @staticmethod
    def proxy_view(request, path):
        if not GrafanaProxy.has_credentials():
            content = {
                'Code': 'ConfigurationIncomplete',
                'Message': 'Grafana seems to be either unconfigured or misconfigured. '
                           'Please check your configuration or contact your system administrator.'
            }
            response = HttpResponse(json.dumps(content), status=500)
            response['Content-Type'] = 'application/json'
            return response

        try:
            return get_grafana_api_response(request, path)
        except RequestException as e:
            return HttpResponse(e.content, e.status_code)
