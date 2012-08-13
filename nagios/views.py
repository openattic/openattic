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

# make "/" operator always use floats
from __future__ import division

import re
import sys
from os.path  import exists, getmtime
from time     import time
from datetime import datetime

from numpy    import array
from colorsys import rgb_to_hls, hls_to_rgb
from StringIO import StringIO
from PIL      import Image

from django.http       import HttpResponse, Http404
from django.shortcuts  import get_object_or_404
from django.utils      import formats

from django.utils.translation import ugettext as _

from systemd.procutils import invoke

from nagios.conf   import settings as nagios_settings
from nagios.models import Service, Graph
from nagios.graphbuilder import RRD, Graph as GraphBuilder

def rgbstr_to_rgb_int(string, default="FFFFFF"):
    """ Turn the given RGB string into a tuple that contains its integer values. """
    if not string or len(string) < 6:
        string = default
    return ( int(string[0:2], 16), int(string[2:4], 16), int(string[4:6], 16) )

# All color values from here are either RGB strings or in [0..1].

def rgbstr_to_rgb(string, default="FFFFFF"):
    """ Turn the given RGB string into a tuple that contains
        its values as floats in [0..1].
    """
    xff = rgbstr_to_rgb_int( string, default )
    return ( xff[0] / 0xFF, xff[1] / 0xFF, xff[2] / 0xFF )

def rgbstr_to_hls(string, default="FFFFFF"):
    """ Turn the given RGB string into an HLS tuple. """
    return rgb_to_hls( *rgbstr_to_rgb( string, default ) )

def get_hls_complementary(hlsfrom):
    """ Get the complementary color to the given color. """
    h = 0.5 + hlsfrom[0]
    if h > 1.0:
        h -= 1.0
    return (h, 1 - hlsfrom[1], hlsfrom[2])

def get_hls_for_srcidx(hlsfrom, srcidx):
    """ Get a unique color for the given srcidx. """
    h = srcidx * 0.3 + hlsfrom[0]
    if h > 1.0:
        h -= 1.0
    return (h, 1 - hlsfrom[1], hlsfrom[2])

def hls_to_rgbstr(hlsfrom):
    """ Turn the given hls tuple into an RGB string. """
    rgbgrad = map( lambda x: x * 0xFF, hls_to_rgb( *hlsfrom ) )
    return "%02X%02X%02X" % tuple(rgbgrad)

def get_gradient_args(varname, hlsfrom, hlsto, steps=20):
    """ Return a list of RRDTool arguments that draw a color gradient for the
        given graph variable. The gradient goes from hlsfrom at the top to
        hlsto at the X axis and uses a resolution specified in `steps'.
    """
    # We do not allow hue to change because that looks stupid
    allowed = array((False, True, True))

    args = []

    for grad in range(steps, 0, -1):
        graphmult = grad/steps
        colormult = (1 - graphmult) ** 2 # exponential gradient looks better than linear

        hlsgrad = array(hlsfrom) + ( ( array(hlsto) - array(hlsfrom) ) * allowed * colormult )

        tempvar = "%sgrd%d" % (varname, grad)
        args.append("CDEF:%s=%s,%.2f,*" % ( tempvar, varname, graphmult ))
        args.append("AREA:%s#%sFF"      % ( tempvar, hls_to_rgbstr(hlsgrad) ))

    return args



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
        graph = None
    else:
        graph = Graph.objects.get(pk=srcidx, command=serv.command)
        srcline = graph.fields

    rrdpath = nagios_settings.RRD_PATH % {
        'host': serv.hostname,
        'serv': serv.description.replace(' ', '_').encode("UTF-8")
        }
    if not exists(rrdpath):
        raise Http404("RRD file not found")

    xmlpath = nagios_settings.XML_PATH % {
        'host': serv.hostname,
        'serv': serv.description.replace(' ', '_').encode("UTF-8")
        }
    if not exists(xmlpath):
        raise Http404("XML file not found")

    rrd = RRD(rrdpath, xmlpath)
    builder = GraphBuilder(rrd, srcline)

    try:
        builder.start  = int(request.GET.get("start",  rrd.last_check - 24*60*60))
        builder.end    = int(request.GET.get("end",    rrd.last_check))
    except ValueError, err:
        print >> sys.stderr, unicode(err)
        raise Http404("Invalid start or end specified")

    builder.height = int(request.GET.get("height", 150))
    builder.width  = int(request.GET.get("width",  700))
    bgcol  = request.GET.get("bgcol", nagios_settings.GRAPH_BGCOLOR)
    builder.fgcol  = request.GET.get("fgcol", nagios_settings.GRAPH_FGCOLOR)
    builder.grcol  = request.GET.get("grcol", nagios_settings.GRAPH_GRCOLOR)
    builder.sacol  = request.GET.get("sacol", "")
    builder.sbcol  = request.GET.get("sbcol", "")
    builder.grad   = request.GET.get("grad", "false") == "true"

    if rrd.last_check < builder.start and "start" in request.GET and "end" not in request.GET:
        # Apparently, something is wrong and Nagios hasn't been checking the service
        # at all in the interval that has been requested. Since start has been explicitly
        # specified, but "end" has not, this leads to the [start,end] interval being
        # invalid. Set the end timestamp to "now", so that RRDtool will just display a
        # grey graph (all values are undefined in the RRD).
        builder.end = int(time())

    if len(bgcol) < 6 or len(builder.fgcol) < 6 or len(builder.grcol) < 6:
        raise Http404("Invalid color specified")

    if graph is not None and builder.width >= 350:
        builder.title += ' - ' + graph.title

    args = builder.get_args()

    def mkdate(text, timestamp):
        return "COMMENT:%-15s %-30s\\j" % (
            text,
            formats.localize( datetime.fromtimestamp(timestamp) ).replace(":", "\\:")
            )

    args.extend([
        "COMMENT: \\j",
        mkdate( _("Start time"), builder.start ),
        mkdate( _("End time"),   builder.end   ),
        ])

    #print args

    ret, out, err = invoke(args, log=False, return_out_err=True)

    if bgcol:
        # User wants a background color, so we made the image transparent
        # before. Now is the time to fix that.
        rgbbg    = rgbstr_to_rgb_int( bgcol )
        imggraph = Image.open(StringIO(out))
        if imggraph.mode == "RGBA":
            # Create a new image that has our desired background color
            imgout   = Image.new( imggraph.mode, imggraph.size, rgbbg )
            # Maybe paste the background image into it
            if nagios_settings.GRAPH_BGIMAGE:
                imgbg = Image.open(nagios_settings.GRAPH_BGIMAGE)
                # position the background image at the bottom right
                posbg = array(imgout.size) - array(imgbg.size) - array((15, 15))
                imgout.paste( imgbg, (posbg[0], posbg[1], imgout.size[0] - 15, imgout.size[1] - 15), imgbg )
            # now paste the graph
            imgout.paste( imggraph, None, imggraph )
            # save into our "out" variable
            buf = StringIO()
            imgout.save( buf, "PNG" )
            out = buf.getvalue()

    return HttpResponse( out, mimetype="image/png" )

