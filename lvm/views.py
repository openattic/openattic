# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.shortcuts  import get_object_or_404
from django.http       import Http404

from plotutils         import piechart

from lvm.models        import LogicalVolume


def lvmemchart(request, lv):
    lv = get_object_or_404(LogicalVolume, id=lv)

    if not lv.filesystem:
        raise Http404("Given LV has no file system")

    lvstat = lv.fs.stat
    reserved = lvstat['size'] - lvstat['used'] - lvstat['free']

    return piechart([lvstat['used'], lvstat['free'], reserved],
        heading=lv.name, explode=[0, 0.05, 0],
        colors = ('#DB6D7C', '#B3DBA2', '#F9F9B8' ),
        titles = ('used', 'free', 'reserved'),
        )
