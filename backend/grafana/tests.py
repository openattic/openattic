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
from django.test import TestCase
from mock import mock

from grafana.grafana_proxy import get_grafana_api_response


class GrafanaResponseTestCase(TestCase):

    @mock.patch('grafana.grafana_proxy.Settings')
    @mock.patch('grafana.grafana_proxy.requests.request')
    def test_response(self, request_mock, Settings_mock):

        request = mock.Mock()
        request.GET.copy.return_value = 42
        request.META = {
            'HTTP_FOO': '',
            'content_type': 'content_type',
            'AUTHORIZATION': 'AUTHORIZATION'
        }

        response = mock.Mock()
        response.content = """
        123456789012345678901234567890
        <a href="/api/openattic/foo">
        <a href='/api/openattic/foo'>
        url('/api/openattic/foo')
        "light":"dark"
        class="search-field-wrapper"
        """
        response.status_code = 42
        response.headers = {}

        request_mock.return_value = response

        self.assertEqual(get_grafana_api_response(request, '/grafana.light.css').content, """
        123456789012345678901234567890
        <a href="/api/grafana/api/openattic/foo">
        <a href='/api/grafana/api/openattic/foo'>
        url('/api/grafana/api/openattic/foo')
        "light":"light"
        class="search-field-wrapper" style="display: none"
        [ng-if="::showSettingsMenu"] { display:none; } [ng-show="::dashboardMeta.canShare"] { display:none; } [ng-click="addRowDefault()"] { display: none; } .dash-row-menu-container { display: none; } .search-results-container .search-item-dash-home { display: none !important; } """)
