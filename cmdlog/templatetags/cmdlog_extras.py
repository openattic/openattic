# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django                  import template
from django.utils.safestring import mark_safe

register = template.Library()

def htmlescape(char):
    specialchars = {
        '"': '&quot;',
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        }
    if char in specialchars:
        return specialchars[char]
    return char

@register.filter
def highlight(body):
    """ Return a HTML annotated version of the posting that has stuff highlighted. """
    res = ""
    ST_BEGINLINE, ST_COMMAND, ST_STDOUT, ST_STDERR = range(4)
    state = ST_BEGINLINE

    for char in body:
        if   state == ST_BEGINLINE:
            if char == ">":
                state = ST_COMMAND
                res += '&gt;<span class="commandline">'
            elif char == 'O':
                res += '|<span class="commandstdout">'
                state = ST_STDOUT
            elif char == 'E':
                state = ST_STDERR
                res += '|<span class="commandstderr">'
            elif char == "\n":
                res += char

        else:
            if char == "\n":
                state = ST_BEGINLINE
                res += '</span>\n'
            else:
                res += htmlescape(char)

    if state != ST_BEGINLINE:
        res += "</span>\n"

    return mark_safe(res)
