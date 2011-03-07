# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.contrib import admin

from models import DrbdDevice

class DrbdDeviceAdmin(admin.ModelAdmin):
    list_display   = [ 'volume', 'selfaddress', 'peeraddress' ]

admin.site.register( DrbdDevice, DrbdDeviceAdmin )
