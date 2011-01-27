# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.contrib import admin

class VgAdmin(admin.ModelAdmin):
    list_display   = [ "name" ]

class LvAdmin(admin.ModelAdmin):
    list_display   = [ 'name', 'vg', 'megs', 'filesystem', 'snapshot' ]


from models import VolumeGroup, LogicalVolume

admin.site.register( VolumeGroup,   VgAdmin )
admin.site.register( LogicalVolume, LvAdmin )
