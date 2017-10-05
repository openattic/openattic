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
import re
from django.test import TestCase
from mock import mock

from grafana.grafana_proxy import get_grafana_api_response, fix_path


class GrafanaResponseTestCase(TestCase):

    @mock.patch('grafana.grafana_proxy.Settings')
    @mock.patch('grafana.grafana_proxy.requests.request')
    def test_hiding_of_dashboard_selection(self, request_method, settings):
        request = mock.Mock()
        request.META = {}
        request.GET.copy.return_value = 42

        response = mock.Mock()
        response.content = '</body>'
        response.headers = {}
        response.status_code = 200
        request_method.return_value = response

        for path in ('ceph-osd', 'ceph-pools', 'ceph-rbd', 'node-statistics',
                     'ceph-object-gateway-users'):
            r = get_grafana_api_response(request, path)
            r.content = re.sub(r'\s', '', r.content)
            self.assertContains(r, '<style>.navbar-section-wrapper{display:none}</style>')

        r = get_grafana_api_response(request, 'bar')
        r.content = re.sub(r'\s', '', r.content)
        self.assertNotContains(r, '<style>.navbar-section-wrapper{display:none}</style>')

    def test_fix_path(self):
        self.assertEqual(fix_path('/foo/bar'), '/foo/bar')
        self.assertEqual(fix_path('/foo/bar/'), '/foo/bar')
        self.assertEqual(fix_path('/123foo456/api/grafana'), '')
        self.assertEqual(fix_path('/openattic/api/grafana'), '')
        self.assertEqual(fix_path('/api/grafana/some/other/stuff'), '/some/other/stuff')
        self.assertEqual(fix_path('/api/grafana/api/grafana/some/other/stuff'), '/some/other/stuff')

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
