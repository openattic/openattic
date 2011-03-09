# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import url, patterns, include
from django.conf import settings

from http import models

urlpatterns = patterns('',
    ( r'addshare/(?P<lvid>\d+)/$', 'lvm.views.generic.add_share_for_lv', {
        'perm':          'http.create_export',
        'template_name': 'http/addshare.html',
        'model':         models.Export,
        'post_create_redirect': settings.PROJECT_URL+'/'
        }, 'http_share_create' ),

    ( r'(?P<object_id>\d+)/del/$',   'view_wrappers.delete_if_perm', {
        'perm':          'http.delete_export',
        'template_name': 'http/exportdelete.html',
        'model':         models.Export,
        'post_delete_redirect': settings.PROJECT_URL+'/'
        }, 'http_export_delete' ),

    ( r'(?P<object_id>\d+)/$',     'view_wrappers.update_if_perm', {
        'perm':          'http.change_export',
        'template_name': 'http/exportedit.html',
        'model':         models.Export,
        'post_save_redirect': settings.PROJECT_URL+'/'
        }, 'http_export_edit' ),

    ( r'/?$', 'django.views.generic.list_detail.object_list', {
        'template_name': 'http/exportlist.html',
        'queryset': models.Export.objects.all(),
        }, 'http_export_list' ),

    )
