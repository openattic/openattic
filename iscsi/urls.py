# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import url, patterns, include
from django.conf import settings

from iscsi import models

urlpatterns = patterns('',
    ( r'i/add/$',  'view_wrappers.create_if_perm', {
        'perm': 'iscsi.add_initiator',
        'template_name': 'iscsi/initiatoredit.html',
        'model': models.Initiator,
        'post_save_redirect': settings.PROJECT_URL+'/iscsi/i/'
        }, 'iscsi_initiator_add' ),

    ( r'i/(?P<object_id>\d+)/del/$', 'view_wrappers.delete_if_perm', {
        'perm': 'iscsi.delete_initiator',
        'template_name': 'iscsi/initiatoredit.html',
        'model': models.Initiator,
        'post_delete_redirect': settings.PROJECT_URL+'/iscsi/i/'
        }, 'iscsi_initiator_delete' ),

    ( r'i/(?P<object_id>\d+)/$',     'view_wrappers.update_if_perm', {
        'perm': 'iscsi.change_initiator',
        'template_name': 'iscsi/initiatoredit.html',
        'model': models.Initiator,
        'post_save_redirect': settings.PROJECT_URL+'/iscsi/i/'
        }, 'iscsi_initiator_edit' ),

    ( r'i/$', 'django.views.generic.list_detail.object_list', {
        'template_name': 'iscsi/initiatorlist.html',
        'queryset': models.Initiator.objects.all(),
        }, 'iscsi_initiator_list' ),


    ( r't/add/$',  'view_wrappers.create_if_perm', {
        'perm': 'iscsi.add_target',
        'template_name': 'iscsi/targetedit.html',
        'model': models.Target,
        'post_save_redirect': settings.PROJECT_URL+'/iscsi/t/'
        }, 'iscsi_target_add' ),

    ( r't/(?P<object_id>\d+)/del/$', 'view_wrappers.delete_if_perm', {
        'perm': 'iscsi.delete_target',
        'template_name': 'iscsi/targetedit.html',
        'model': models.Target,
        'post_delete_redirect': settings.PROJECT_URL+'/iscsi/t/'
        }, 'iscsi_target_delete' ),

    ( r't/(?P<object_id>\d+)/$',     'view_wrappers.update_if_perm', {
        'perm': 'iscsi.change_target',
        'template_name': 'iscsi/targetedit.html',
        'model': models.Target,
        'post_save_redirect': settings.PROJECT_URL+'/iscsi/t/'
        }, 'iscsi_target_edit' ),

    ( r't/$', 'django.views.generic.list_detail.object_list', {
        'template_name': 'iscsi/targetlist.html',
        'queryset': models.Target.objects.all(),
        }, 'iscsi_target_list' ),


    ( r'addshare/(?P<lvid>\d+)/$', 'lvm.views.generic.add_share_for_lv', {
        'perm':          'iscsi.create_export',
        'template_name': 'iscsi/addshare.html',
        'model':         models.Lun,
        'post_create_redirect': settings.PROJECT_URL+'/'
        }, 'iscsi_share_create' ),

    ( r'(?P<object_id>\d+)/del/$',   'view_wrappers.delete_if_perm', {
        'perm':          'iscsi.delete_lun',
        'template_name': 'iscsi/lundelete.html',
        'model':         models.Lun,
        'post_delete_redirect': settings.PROJECT_URL+'/'
        }, 'iscsi_lun_delete' ),

    ( r'(?P<object_id>\d+)/$',     'view_wrappers.update_if_perm', {
        'perm':          'iscsi.change_lun',
        'template_name': 'iscsi/lunedit.html',
        'model':         models.Lun,
        'post_save_redirect': settings.PROJECT_URL+'/'
        }, 'iscsi_lun_edit' ),

    #( r'/?$',                'exportlist' ),
    )
