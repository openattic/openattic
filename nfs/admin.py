# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.contrib import admin

def exportremove(modeladmin, request, queryset):
    for export in queryset:
        export.state = "delete"
        export.save()

exportremove.short_description = "Delete Export"

class ExportAdmin(admin.ModelAdmin):
    list_display   = [ 'volume', 'address', 'options' ]
    actions        = [ exportremove ]


from models import Export

admin.site.register( Export, ExportAdmin )
