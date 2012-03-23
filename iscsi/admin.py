# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""

from django.contrib import admin

class TargetAdmin(admin.ModelAdmin):
    list_display   = [ "name" ]

class LunAdmin(admin.ModelAdmin):
    list_display   = [ 'number', 'target', 'volume', 'ltype' ]


from iscsi.models import Target, Lun, Initiator

admin.site.register( Target, TargetAdmin )
admin.site.register( Lun,    LunAdmin    )
admin.site.register( Initiator )
