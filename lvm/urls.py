# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import url, patterns, include
from django.conf import settings

from lvm import models

urlpatterns = patterns('',
    ( r'addshare/$',                 'lvm.views.lvaddshare' ),

    ( r'add/$',                      'view_wrappers.create_if_perm', {
        'perm':               'lvm.add_logicalvolume',
        'template_name':      'lvm/lvadd.html',
        'model':              models.LogicalVolume,
        'post_save_redirect': settings.PROJECT_URL+'/'
        }, 'lvm_logicalvolume_add' ),

    ( r'(?P<object_id>\d+)/$',       'view_wrappers.update_if_perm', {
        'perm':               'lvm.change_logicalvolume',
        'template_name':      'lvm/lvedit.html',
        'model':              models.LogicalVolume,
        'post_save_redirect': settings.PROJECT_URL+'/'
        }, 'lvm_logicalvolume_edit' ),

    ( r'(?P<object_id>\d+)/del/$',    'view_wrappers.delete_if_perm', {
        'perm':               'lvm.delete_logicalvolume',
        'template_name':      'lvm/lvdelete.html',
        'model':              models.LogicalVolume,
        'post_delete_redirect': settings.PROJECT_URL+'/'
        }, 'lvm_logicalvolume_delete' ),


    ( r'vgs/?$',                     'lvm.views.vglist' ),
    ( r'/?$',                        'lvm.views.lvlist' ),
    )
