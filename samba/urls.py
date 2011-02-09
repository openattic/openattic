# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import url, patterns, include
from django.conf import settings

from samba import models

urlpatterns = patterns('',
    ( r'addshare/(?P<lvid>\d+)/$', 'samba.views.add_share_for_lv' ),

    ( r'(?P<object_id>\d+)/del/$',   'view_wrappers.delete_if_perm', {
        'perm':          'samba.delete_lun',
        'template_name': 'samba/sharedelete.html',
        'model':         models.Share,
        'post_delete_redirect': settings.PROJECT_URL+'/'
        }, 'samba_share_delete' ),

    ( r'(?P<object_id>\d+)/$',     'view_wrappers.update_if_perm', {
        'perm':          'samba.change_share',
        'template_name': 'samba/shareedit.html',
        'model':         models.Share,
        'post_save_redirect': settings.PROJECT_URL+'/'
        }, 'samba_share_edit' ),

    ( r'/?$', 'django.views.generic.list_detail.object_list', {
        'template_name': 'samba/sharelist.html',
        'queryset': models.Share.objects.all(),
        }, 'samba_share_list' ),

    )
