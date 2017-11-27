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

import rest.views

urlpatterns = [
    (r'^api/auth$', rest.views.AuthView.as_view(), {}, 'authenticate'),
    # we need a second URL for the do_login view which can be configured
    # using an Apache <Location> directive to authenticate using Kerberos.
    (r'^accounts/kerblogin.js$', 'rest.views.do_login', {}, 'kerblogin')
]
