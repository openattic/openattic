# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import url, patterns, include
from django.conf import settings

urlpatterns = patterns('nfs.views',
    ( r'addshare/(?P<lvid>\d+)/$', 'add_share_for_lv' ),

    ( r'(?P<eid>\d+)/del/$',    'exportdelete' ),
    ( r'(?P<eid>\d+)/?$',    'exportedit' ),
    #( r'/?$',                'exportlist' ),
    )
