# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import url, patterns, include
from django.conf import settings

urlpatterns = patterns('samba.views',
    ( r'addshare/(?P<lvid>\d+)/$', 'add_share_for_lv' ),

    ( r'(?P<sid>\d+)/del/$',       'sharedelete' ),
    ( r'(?P<sid>\d+)/?$',          'shareedit' ),
    )
