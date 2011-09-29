# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

# I know this stuff shouldn't be in the LVM app because it's used by
# the main templates, not by LVM ones.
# I just don't quite know how to load template libraries from outside
# an app directory, and we can assume the LVM app to be available in
# every openATTIC installation.

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
