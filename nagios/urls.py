# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import url, patterns, include
from django.conf import settings

from lvm import models

urlpatterns = patterns('',
    ( r'(?P<service_id>\d+)/(?P<srcidx>\d+)\.png', 'nagios.views.graph' ),
    )
