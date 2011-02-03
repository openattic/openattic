# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.contrib import admin

class TargetAdmin(admin.ModelAdmin):
    list_display   = [ "name" ]

class LunAdmin(admin.ModelAdmin):
    list_display   = [ 'number', 'target', 'volume', 'ltype' ]


from models import Target, Lun, Initiator

admin.site.register( Target, TargetAdmin )
admin.site.register( Lun,    LunAdmin    )
admin.site.register( Initiator )
