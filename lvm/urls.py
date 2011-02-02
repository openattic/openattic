# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import url, patterns, include
from django.conf import settings

urlpatterns = patterns('lvm.views',
    ( r'addshare/$',                 'lvaddshare' ),

    ( r'(?P<lvid>\d+)/del/$',        'lvdelete' ),
    ( r'(?P<lvid>\d+)/?$',           'lvedit' ),
    ( r'add/$',                      'lvadd'  ),

    ( r'/?$',                        'lvlist' ),
    )
