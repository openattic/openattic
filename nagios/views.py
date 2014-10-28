# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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

# make "/" operator always use floats
from __future__ import division

import sys
from time     import time

from django.http       import HttpResponse, Http404
from django.shortcuts  import get_object_or_404

from nagios.conf   import settings as nagios_settings
from nagios.models import Service, Graph
from nagios.graphbuilder import Graph as GraphBuilder, parse



def graph(request, service_id, srcidx):
    """ Creates a graph image using RRDTool.

        Arguments passed in the URL are:

        * service_id: The id of the :class:`nagios.models.Service` instance to monitor.
        * srcidx: What to draw.

          If `service_id` points to a service that uses a check command for which one or more
          :class:`nagios.models.Graph` model instances exist, the srcidx names the ID of the
          Graph instance which is to be drawn. In this case, a single image may contain multiple
          graphs stacked on one another.

          Otherwise, the service's performance data will be regarded as an array, and srcidx points to
          the index of the value that is to be drawn. In this case, a single image only contains a
          single graph, as Multigraph support is configured using the nagios.Graph entries.

        Optionally, this view allows for a set of GET variables to be passed in order to modify
        the image's appearance:

        * start:  Beginning timestamp. Defaults to "24 hours ago".
        * end:    End timestamp. Defaults to the time when the service was last checked.
        * height: Height of the graph section (not the image itself!)
        * width:  Width of the graph section (not the image itself!)
        * bgcol:  Background color, in "rrggbb".
        * fgcol:  Foreground (text) color.
        * grcol:  Graph background color.
        * sacol:  Shade-A color (top left border).
        * sbcol:  Shade-B color (bottom right border).
        * grad:   Use color gradients (true/false).

        If the image should be rendered upon a background image, the image's path needs to be
        configured in the Nagios module's settings.
    """
    serv  = get_object_or_404(Service, pk=int(service_id))

    try:
        srcidx = int(srcidx)
    except ValueError:
        # string, apparently
        srcline = srcidx
        dbgraph = None
    else:
        dbgraph = Graph.objects.get(pk=srcidx, command=serv.command)
        srcline = dbgraph.fields

    try:
        rrd = serv.rrd
    except SystemError, err:
        raise Http404(unicode(err))

    builder = GraphBuilder()
    for src in parse(srcline):
        builder.add_source( src.get_value(rrd) )

    try:
        builder.start  = int(request.GET.get("start",  rrd.last_check - 24*60*60))
        builder.end    = int(request.GET.get("end",    rrd.last_check))
    except ValueError, err:
        print >> sys.stderr, unicode(err)
        raise Http404("Invalid start or end specified")

    builder.height = int(request.GET.get("height", 150))
    builder.width  = int(request.GET.get("width",  700))
    bgcol  = request.GET.get("bgcol", nagios_settings.GRAPH_BGCOLOR)
    builder.bgcol  = bgcol
    builder.fgcol  = request.GET.get("fgcol", nagios_settings.GRAPH_FGCOLOR)
    builder.grcol  = request.GET.get("grcol", nagios_settings.GRAPH_GRCOLOR)
    builder.sacol  = request.GET.get("sacol", "")
    builder.sbcol  = request.GET.get("sbcol", "")
    builder.grad   = request.GET.get("grad", "false") == "true"
    builder.bgimage = nagios_settings.GRAPH_BGIMAGE

    if rrd.last_check < builder.start and "start" in request.GET and "end" not in request.GET:
        # Apparently, something is wrong and Nagios hasn't been checking the service
        # at all in the interval that has been requested. Since start has been explicitly
        # specified, but "end" has not, this leads to the [start,end] interval being
        # invalid. Set the end timestamp to "now", so that RRDtool will just display a
        # grey graph (all values are undefined in the RRD).
        builder.end = int(time())

    if (bgcol and len(bgcol) < 6) or (builder.fgcol and len(builder.fgcol) < 6) or (builder.grcol and len(builder.grcol) < 6):
        raise Http404("Invalid color specified")

    builder.title = serv.description
    if dbgraph is not None:
        builder.verttitle = dbgraph.verttitle
        if builder.width >= 350:
            builder.title += ' - ' + dbgraph.title


    return HttpResponse( builder.get_image(), content_type="image/png" )

