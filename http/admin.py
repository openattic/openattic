# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.contrib import admin

from http.models import Export

class ExportAdmin(admin.ModelAdmin):
    list_display   = [ 'volume', ]

admin.site.register( Export, ExportAdmin )
