# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

# I know this stuff shouldn't be in the LVM app because it's used by
# the main templates, not by LVM ones.
# I just don't quite know how to load template libraries from outside
# an app directory, and we can assume the LVM app to be available in
# every openATTIC installation.

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

from django import template

register = template.Library()

@register.filter
def template_exists(tpl):
    try:
        template.loader.get_template(tpl)
    except template.TemplateDoesNotExist:
        return False
    else:
        return True
