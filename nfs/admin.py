# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.contrib import admin

class ExportAdmin(admin.ModelAdmin):
    list_display   = [ 'volume', 'address', 'options' ]


from models import Export

admin.site.register( Export, ExportAdmin )
