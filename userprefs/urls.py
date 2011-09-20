# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import url, patterns, include

urlpatterns = patterns('',
    ( r'initprefs.js$',                 'userprefs.views.get_prefs' ),
)
