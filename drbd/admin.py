# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.contrib import admin

from models import DrbdDevice
from forms  import DrbdDeviceForm

class DrbdDeviceAdmin(admin.ModelAdmin):
    list_display   = [ 'volume', 'selfaddress', 'peeraddress' ]

    form = DrbdDeviceForm

admin.site.register( DrbdDevice, DrbdDeviceAdmin )
