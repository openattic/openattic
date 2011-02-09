# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django                 import template

register = template.Library()

@register.filter
def shareitem(share):
    return "%s/shareitem.html" % share.share_type
