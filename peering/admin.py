# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.contrib import admin

from models import PeerHost

class PeerHostAdmin(admin.ModelAdmin):
    list_display   = [ 'name', 'clusterpeer', 'address' ]

    def address(self, obj):
        if obj.base_url:
            return obj.base_url.hostname
        return ''

admin.site.register( PeerHost, PeerHostAdmin )
