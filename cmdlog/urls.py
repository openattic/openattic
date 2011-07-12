# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import url, patterns, include
from django.conf import settings

from cmdlog import models

urlpatterns = patterns('',
    ( r'(?P<object_id>\d+)/$', 'django.views.generic.list_detail.object_detail', {
        'template_name':      'cmdlog/detail.html',
        'queryset': models.LogEntry.objects.all(),
        }, 'cmdlog_entry_detail' ),

    ( r'/?$', 'django.views.generic.list_detail.object_list', {
        'template_name': 'cmdlog/list.html',
        'queryset': models.LogEntry.objects.all().order_by('-starttime'),
        }, 'cmdlog_entry_list' ),

    )
