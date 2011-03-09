# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import url, patterns, include
from django.conf import settings

from nfs import models

urlpatterns = patterns('',
    ( r'addshare/(?P<lvid>\d+)/$', 'lvm.views.generic.add_share_for_lv', {
        'perm':          'nfs.create_export',
        'template_name': 'nfs/addshare.html',
        'model':         models.Export,
        'post_create_redirect': settings.PROJECT_URL+'/'
        }, 'nfs_share_create' ),

    ( r'(?P<object_id>\d+)/del/$',   'view_wrappers.delete_if_perm', {
        'perm':          'nfs.delete_export',
        'template_name': 'nfs/exportdelete.html',
        'model':         models.Export,
        'post_delete_redirect': settings.PROJECT_URL+'/'
        }, 'nfs_export_delete' ),

    ( r'(?P<object_id>\d+)/$',     'view_wrappers.update_if_perm', {
        'perm':          'nfs.change_export',
        'template_name': 'nfs/exportedit.html',
        'model':         models.Export,
        'post_save_redirect': settings.PROJECT_URL+'/'
        }, 'nfs_export_edit' ),

    ( r'/?$', 'django.views.generic.list_detail.object_list', {
        'template_name': 'nfs/exportlist.html',
        'queryset': models.Export.objects.all(),
        }, 'nfs_export_list' ),

    )
