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

import logging
import re
import time

import requests
from django.http import HttpResponse
from oa_settings import Settings
from rest_framework.reverse import reverse

from rest_client import RestClient

logger = logging.getLogger(__name__)


class GrafanaProxy(RestClient):
    _instance = None

    @staticmethod
    def instance():
        """
        :rtype: GrafanaProxy
        """
        if GrafanaProxy._instance is None:
            ssl = Settings.GRAFANA_API_SCHEME.lower() == 'https'
            GrafanaProxy._instance = GrafanaProxy(Settings.GRAFANA_API_HOST,
                                                  Settings.GRAFANA_API_PORT,
                                                  Settings.GRAFANA_API_USERNAME,
                                                  Settings.GRAFANA_API_PASSWORD,
                                                  ssl)
        return GrafanaProxy._instance

    def __init__(self, host, port, username, password, ssl=False):
        super(GrafanaProxy, self).__init__(host, port, 'Grafana', ssl, auth=(username, password))
        self.token = None

    def _is_logged_in(self):
        return True

    @staticmethod
    def has_credentials():
        return Settings.has_values('GRAFANA_API_')

    @RestClient.api_get('/api/org/users', resp_structure='[*]')
    @RestClient.requires_login
    def is_service_online(self, request=None):
        return request()


def fix_path(path):
    """
    :type path: str
    :rtype: str
    """
    replaced_path = re.sub('(\w+/)?api/grafana', '', path)
    replaced_path = re.sub(r'^/+(.*)', r'/\1', replaced_path)
    replaced_path = replaced_path.rstrip('/')
    return replaced_path


def get_grafana_api_response(request, path):
    path = fix_path(path)

    base_url_prefix = reverse('grafana', args=['/']).rstrip('/')  # e.g. /openattic/api
    params = request.GET.copy()
    scheme = 'https' if Settings.GRAFANA_API_SCHEME.lower() == 'https' else 'http'
    url = '{}://{}:{}/{}'.format(scheme, Settings.GRAFANA_API_HOST, Settings.GRAFANA_API_PORT,
                                 path.lstrip('/'))
    auth = (Settings.GRAFANA_API_USERNAME, Settings.GRAFANA_API_PASSWORD)

    headers = {header.replace(r'HTTP_', ''): value for header, value
               in request.META.items()
               if header.startswith('HTTP_') or header.lower() == 'content_type'}

    if 'AUTHORIZATION' in headers:
        headers.pop('AUTHORIZATION')

    if 'REFERER' in headers:
        headers['REFERER'] = headers['REFERER'].replace(base_url_prefix, '')

    nheaders = {}
    for key, value in headers.items():
        nheaders[key.replace('_', '-')] = value

    if 'COOKIE' in request.META:
        cookies = request.META['COOKIE']
        auth = None
    else:
        cookies = None

    response = requests.request(request.method, url, data=request.body, params=params,
                                auth=auth,
                                headers=nheaders, cookies=cookies)

    # General replacements to make basics work and other adjustments.

    replacements = {
        'href=\'/': 'href=\'{base_url}/',
        'href="/': 'href="{base_url}/',
        'src="/': 'src="{base_url}/',
        '"/avatar': '"{base_url}/avatar',
        'getUrl("/': 'getUrl("{base_url}/',
        'getUrl()/': 'getUrl("{base_url}")',
        'url("/': 'url("{base_url}/',
        'url(\'/': 'url(\'{base_url}/',
        '"url":"/': '"url":"{base_url}/',
        'get("/': 'get("{base_url}/',
        'get(\'/': 'get(\'{base_url}/',
        'put("/': 'put("{base_url}/',
        'put(\'/': 'put(\'{base_url}/',
        'post("/': 'post("{base_url}/',
        'post(\'/': 'post(\'{base_url}/',
        'delete("/': 'delete("{base_url}/',
        'delete(\'/': 'delete(\'{base_url}/',
        'd.default.appSubUrl+a.$location.path()': '"{base_url}/profile"',

        'appSubUrl+"/': 'appSubUrl+"{base_url}/',  # Home on `Dashboard search`

        # Deactivate main menu, but keep icon.
        '<a class="navbar-brand-btn pointer" ng-click="ctrl.toggleSideMenu()"><span class="navbar-b'
        'rand-btn-background"><img src="public/img/grafana_icon.svg"></span><i class="icon-gf i'
        'con-gf-grafana_wordmark"></i> <i class="fa fa-caret-down"></i> <i class="fa fa-chevron'
        '-left"></i></a>': '<span class="navbar-brand-btn"><span class="navbar-brand-'
                           'btn-background"><img src="public/img/grafana_icon.svg">'
                           '</span></span>',

        # Enforce light theme.
        '"light":"dark"': '"light":"light"',
        'this.style=a.style||"dark"': 'this.style="light"',
        'System.import(a.dark + "!css")': 'System.import(a.light + "!css")',

        # hide some items on navbar.
        'dashnav-action-icons"': 'dashnav-action-icons" style="display: none"',
        'class="dashnav-move-timeframe': 'style="display: none" class="dashnav-move-timeframe',
        'class="dashnav-zoom-out': 'style="display: none" class="dashnav-zoom-out',

        # hide some items on find dashboard panel
        'class="search-field-wrapper"': 'class="search-field-wrapper" style="display: none"',
        'class="search-result-tags"': 'class="search-result-tags" style="display: none"',
        'class="search-button-row"': 'class="search-button-row" style="display: none"',
        'class="fa search-result-icon"': 'style="display: none" class="search-result-icon"',
    }

    content = response.content

    lpad, rpad = 20, 20
    position = 0
    for search, replacement in replacements.items():
        replacement = replacement.format(base_url=base_url_prefix)

        while True:
            position = content.find(search, position)
            if position == -1:
                position = 0
                break

            original_context = content[position - lpad:position + len(search) + rpad]
            content = content[:position] + content[position:].replace(search, replacement, 1)
            replaced_context = content[position - lpad:position + len(replacement) + rpad]

            logger.debug(
                'Replaced   {}   with   {}  '.format(original_context, replaced_context))

            position += len(replacement)

    content = re.sub(r'grafana\.(light|dark)\.min\.(\w+?)\.css',
                     r'grafana.light.min.css?cache_buster=\2',
                     content)

    # Replacements based on paths.

    if re.search(r'grafana\.(light|dark)\.(min\.)?(\w+\.)?css', path):
        content += '[ng-if="::showSettingsMenu"] { display:none; } '
        content += '[ng-show="::dashboardMeta.canShare"] { display:none; } '
        content += '[ng-click="addRowDefault()"] { display: none; } '
        content += '.dash-row-menu-container { display: none; } '
        content += '.search-results-container .search-item-dash-home { display: none !important; } '

    # Hides the dashboard select box of Grafana on various pages.
    if any(search in path for search in ('ceph-osd', 'ceph-pools', 'ceph-rbd', 'node-statistics',
                                         'ceph-object-gateway-users')):
        tag = '<style>{content}</style>'
        tag = tag.format(content="""
            .navbar-section-wrapper { display: none }
        """)
        content = re.sub(r'</body>', tag + '</body>', content)

    if any(search in path for search in ['ceph-osd', 'ceph-pools', 'node-statistics']):
        tag = '<style>{content}</style>'
        tag = tag.format(content="""
            .submenu-controls > div.submenu-item:nth-child(n+2) { display: none !important; }
        """)

        content = re.sub(r'</body>', tag + '</body>', content)

    if 'node-statistics' in path:
        content = re.sub(r'</body>', """<style>
        .submenu-controls { display: none }
        </style>""" + '</body>', content)

    proxy_response = HttpResponse(content, response.status_code)

    for key, value in response.headers.items():
        if key.lower() in ['content-type', 'cookie', 'set-cookie']:
            proxy_response[key] = value

    return proxy_response
