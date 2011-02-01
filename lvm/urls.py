# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import url, patterns, include
from django.conf import settings

urlpatterns = patterns('lvm.views',
    ( r'/?$',    'lvlist' ),
    )
