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
from django.conf.urls import patterns, url
from oa_settings.views import SettingsView, CheckDeepSeaConnectionView, CheckGrafanaConnectionView, \
                              CheckRGWConnectionView, GetRGWConfigurationView, \
                              CheckCephCofigurationView


urlpatterns = patterns('',
                       url(r'^api/settings/check_deepsea_connection$',
                           CheckDeepSeaConnectionView.as_view(), name='settings_check_deepsea'),
                       url(r'^api/settings/check_grafana_connection$',
                           CheckGrafanaConnectionView.as_view(), name='settings_check_grafana'),
                       url(r'^api/settings/check_rgw_connection$',
                           CheckRGWConnectionView.as_view(), name='settings_check_rgw'),
                       url(r'^api/settings/get_rgw_configuration$',
                           GetRGWConfigurationView.as_view(), name='settings_get_rgw_conf'),
                       url(r'^api/settings/check_ceph_configuration$',
                           CheckCephCofigurationView.as_view(), name='settings_check_ceph_conf'),
                       url(r'^api/settings$', SettingsView.as_view(), name="settings"))
