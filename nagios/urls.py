# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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

from django.conf.urls import patterns

urlpatterns = patterns('',
    ( r'v/(?P<storageobj_id>\d+)/(?P<graph_title>[\s\w_\.\-\(\)/]+)\.png', 'nagios.views.storageobj_graph' ),
    ( r'(?P<service_id>\d+)/(?P<srcidx>[\d\w_\.-]+)\.png', 'nagios.views.graph' ),
    )
