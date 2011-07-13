# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.contrib import admin

from models import PeerHost
from forms  import PeerHostForm

class PeerHostAdmin(admin.ModelAdmin):
    form = PeerHostForm

admin.site.register( PeerHost, PeerHostAdmin )
