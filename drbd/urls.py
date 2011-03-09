# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import url, patterns, include
from django.conf import settings

from drbd import models

urlpatterns = patterns('',
    ( r'add/$',                      'view_wrappers.create_if_perm', {
        'perm':               'drbd.add_drbddevice',
        'template_name':      'drbd/deviceadd.html',
        'model':              models.DrbdDevice,
        'post_save_redirect': settings.PROJECT_URL+'/'
        }, 'drbd_device_add' ),

    ( r'(?P<object_id>\d+)/$',       'view_wrappers.update_if_perm', {
        'perm':               'drbd.change_drbddevice',
        'template_name':      'drbd/deviceedit.html',
        'model':              models.DrbdDevice,
        'post_save_redirect': settings.PROJECT_URL+'/'
        }, 'drbd_device_edit' ),

    ( r'(?P<object_id>\d+)/del/$',    'view_wrappers.delete_if_perm', {
        'perm':               'drbd.delete_drbddevice',
        'template_name':      'drbd/devicedelete.html',
        'model':              models.DrbdDevice,
        'post_delete_redirect': settings.PROJECT_URL+'/'
        }, 'drbd_device_delete' ),

    ( r'/?$', 'django.views.generic.list_detail.object_list', {
        'template_name': 'drbd/devicelist.html',
        'queryset': models.DrbdDevice.objects.all(),
        }, 'lvm_export_list' ),

    )
