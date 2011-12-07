# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

# make "/" operator always use floats
from __future__ import division

import re
from os.path  import exists
from time     import time
from datetime import datetime

from numpy    import array
from colorsys import rgb_to_hls, hls_to_rgb
from StringIO import StringIO
from PIL      import Image

from django.http       import HttpResponse, Http404
from django.shortcuts  import get_object_or_404

from django.utils.translation import ugettext as _
from django.utils.dateformat  import format as format_date
from django.utils.translation import get_date_formats

from systemd.procutils import invoke

from nagios.conf   import settings as nagios_settings
from nagios.models import Service, Graph


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
        rgbgrad = map( lambda x: x * 0xFF, hls_to_rgb( *hlsgrad ) )

        tempvar = "%sgrd%d" % (varname, grad)
        args.append("CDEF:%s=%s,%.2f,*" % ( tempvar, varname, graphmult ))
        args.append("AREA:%s#%02X%02X%02XFF"  % ( (tempvar,) + tuple(rgbgrad) ))

    return args



def graph(request, service_id, srcidx):
    """ The actual view that creates a graph image using RRDTool. """
    serv  = get_object_or_404(Service, pk=int(service_id))

    srcidx = int(srcidx)
    try:
        graph = Graph.objects.get(pk=srcidx, command=serv.command)
    except Graph.DoesNotExist:
        graph = None
        indexes = [str(srcidx)]
    else:
        indexes = graph.fields.split(' ')

    perfdata = serv.perfdata
    if not perfdata:
        raise Http404("Performance data not available")

    rrdpath = nagios_settings.RRD_PATH % serv.description.replace(' ', '_').encode("UTF-8")
    if not exists(rrdpath):
        raise Http404("RRD file not found")

    try:
        lastcheck = int(serv.state["last_check"])
    except:
        lastcheck = int(time())

    start  = request.GET.get("start",  str(lastcheck - 24*60*60))
    end    = request.GET.get("end",    str(lastcheck))
    height = int(request.GET.get("height", 150))
    width  = int(request.GET.get("width",  700))
    bgcol  = request.GET.get("bgcol", nagios_settings.GRAPH_BGCOLOR)
    fgcol  = request.GET.get("fgcol", nagios_settings.GRAPH_FGCOLOR)
    grcol  = request.GET.get("grcol", nagios_settings.GRAPH_GRCOLOR)
    grad   = request.GET.get("grad", "false") == "true"

    try:
        start = int(start)
        end   = int(end)
    except ValueError:
        raise Http404("Invalid start or end specified")
    if (bgcol and len(bgcol) < 6) or (fgcol and len(fgcol) < 6) or (grcol and len(grcol) < 6):
        raise Http404("Invalid color specified")

    graphtitle = serv.description
    if graph is not None and width >= 350:
        graphtitle += ' - ' + graph.title

    args = [
        "rrdtool", "graph", "-", "--start", str(start), "--end", str(end), "--height", str(height),
        "--width", str(width), "--imgformat", "PNG", "--title", graphtitle,
        ]

    if graph is None:
        # We don't have Graphing information, so read it from the perfdata.
        # Try to match the unit of the current value for the vertical title.
        m = re.match( '\d+(?:\.\d+)?(?P<unit>[^\d;]+)?(?:;.*)?', perfdata[srcidx][1] )
        if m:
            if m.group("unit"):
                args.extend([ "--vertical-label", m.group("unit") ])

    elif graph.verttitle:
        args.extend([ "--vertical-label", graph.verttitle ])

    if bgcol:
        # User wants a background color. Make the background transparent
        # here, so that we can apply the background color and image later.
        args.extend([ "--color", "BACK#00000000" ])
    if fgcol:
        args.extend([ "--color", "FONT#"+fgcol ])
    if grcol:
        args.extend([ "--color", "CANVAS#"+grcol ])

    # Calc the maximum length required in the Graph name colum to be able to make it wide enough.
    # See the "for" loop below for that if statement. boils down to "get x if index == -x else index"
    maxlen = max( [ len( perfdata[ int(srcidx[1:]) if srcidx[0] == '-' else int(srcidx) ][0] )
                    for srcidx in indexes ] )

    # rrdtool uses \\j for newline.
    args.append("COMMENT:  \\j")
    # Print the table titles. First some empty space for where the graph names are...
    args.append("COMMENT:  " + (" " * maxlen))
    # ...then the actual titles + space for the unit identifier.
    if width >= 350:
        args.extend([
            "COMMENT:%8s " % "Cur",
            "COMMENT:%8s " % "Min",
            "COMMENT:%8s " % "Avg",
            "COMMENT:%8s \\j" % "Max",
            ])
    else:
        args.extend([
            "COMMENT:%8s " % "Cur",
            "COMMENT:%8s \\j" % "Avg",
            ])

    # Draw an HRULE for the x axis. important for graphs that go +/-.
    args.append("HRULE:0#000000")

    if grad:
        hlsbg = get_hls_complementary( rgbstr_to_hls( grcol ) )

    for srcidx in indexes:
        # srcidx gives the perfdata index which we are drawing. e.g. if perfdata contains
        # rxbytes=13 txbytes=37, srcidx says what to draw. -0 = rxbytes inverted, 1 = txbytes etc.
        invert = False
        if srcidx[0] == '-':
            invert = True
            srcidx = int(srcidx[1:])
        else:
            srcidx = int(srcidx)

        # perfdata[srcidx] = (graph title, perfdata)
        graphname  = perfdata[srcidx][0]
        perfvalues = perfdata[srcidx][1].split(';')

        # Find the current value (perfvalues[1] also contains the unit, simply float() won't work)
        m = re.match( '^(?P<value>\d+(?:\.\d+)?)(?:[^\d;]*)$', perfvalues[0] )
        if m:
            if m.group("value"):
                curr = float(m.group("value"))
        else:
            curr = None

        # maybe we have curr;warn;crit;min;max -- get them and auto-convert if needed
        def getval(idx):
            if len(perfvalues) > idx and perfvalues[idx]:
                return float(perfvalues[idx]) * (-1 if invert else 1)
            return None

        warn = getval(1)
        crit = getval(2)
        vmin = getval(3)
        vmax = getval(4)

        # First of all, define the graph itself.
        args.append( "DEF:var%d=%s:%d:AVERAGE" % (srcidx, rrdpath, int(srcidx) + 1) )

        if warn and crit:
            # LIMIT the graphs so everything from 0 to WARN is green, WARN to CRIT is yellow, > CRIT is red.
            # Using three lines here also creates three dots in the description table, so use a single one
            # and set its color according to the current value.
            lineclr = "00AA00"
            if curr >= warn:
                lineclr = "AAAA00"
            if curr >= crit:
                lineclr = "AA0000"
            if not invert:
                args.extend([
                    # line above everything that holds the description
                    "LINE1:var%d#%sCC:%-*s"             % (srcidx, lineclr, maxlen, graphname),
                    # LIMIT 0 < value < warn
                    "CDEF:var%dok=var%d,0,%.1f,LIMIT"   % (srcidx, srcidx, warn),
                    # LIMIT warn < value < crit
                    "CDEF:var%dw=var%d,%.1f,%.1f,LIMIT" % (srcidx, srcidx, warn, crit),
                    # LIMIT crit < value < INF
                    "CDEF:var%dc=var%d,%.1f,INF,LIMIT"  % (srcidx, srcidx, crit),
                    ])
                if not grad:
                    args.extend([
                        "AREA:var%dok#00AA0070:"        % (srcidx),
                        "AREA:var%dw#AAAA0070:"         % (srcidx),
                        "AREA:var%dc#AA000070:"         % (srcidx),
                        ])
                else:
                    args.extend( get_gradient_args( ("var%dok" % srcidx), rgbstr_to_hls("00AA00"), hlsbg ) )
                    args.extend( get_gradient_args( ("var%dw" % srcidx),  rgbstr_to_hls("AAAA00"), hlsbg ) )
                    args.extend( get_gradient_args( ("var%dc" % srcidx),  rgbstr_to_hls("AA0000"), hlsbg ) )
            else:
                # values are negative here, so we have to match inverted!
                args.extend([
                    # define the negative graph
                    "CDEF:var%dneg=var%d,-1,*"                % (srcidx, srcidx),
                    # line above everything that holds the description
                    "LINE1:var%dneg#%sCC:%-*s"                % (srcidx, lineclr, maxlen, graphname),
                    # LIMIT warn < value < 0
                    "CDEF:var%dnegok=var%dneg,%.1f,0,LIMIT"   % (srcidx, srcidx, warn),
                    # LIMIT crit < value < warn
                    "CDEF:var%dnegw=var%dneg,%.1f,%.1f,LIMIT" % (srcidx, srcidx, crit, warn),
                    # LIMIT -INF < value < warn
                    "CDEF:var%dnegc=var%dneg,INF,%.1f,LIMIT"  % (srcidx, srcidx, crit),
                    ])
                if not grad:
                    args.extend([
                        "AREA:var%dnegok#00AA0070:"           % (srcidx),
                        "AREA:var%dnegw#AAAA0070:"            % (srcidx),
                        "AREA:var%dnegc#AA000070:"            % (srcidx),
                        ])
                else:
                    args.extend( get_gradient_args( ("var%dnegok" % srcidx), rgbstr_to_hls("00AA00"), hlsbg ) )
                    args.extend( get_gradient_args( ("var%dnegw" % srcidx),  rgbstr_to_hls("AAAA00"), hlsbg ) )
                    args.extend( get_gradient_args( ("var%dnegc" % srcidx),  rgbstr_to_hls("AA0000"), hlsbg ) )

        else:
            # We don't know warn and crit, so use a blue color.
            if not invert:
                if grad:
                    args.extend( get_gradient_args( ("var%d" % srcidx), rgbstr_to_hls("0000AA"), hlsbg ) )
                else:
                    args.append( "AREA:var%d#0000AA50:"  % (srcidx) )
                args.append( "LINE1:var%d#0000AACC:%-*s" % (srcidx, maxlen, graphname) )
            else:
                args.append( "CDEF:var%dneg=var%d,-1,*"  % (srcidx, srcidx) )
                if grad:
                    args.extend( get_gradient_args( ("var%dneg" % srcidx), rgbstr_to_hls("0000AA"), hlsbg ) )
                else:
                    args.append( "AREA:var%dneg#0000AA50:"  % (srcidx) )
                args.append( "LINE1:var%dneg#0000AACC:%-*s" % (srcidx, maxlen, graphname) )

        # In cases where the values are unknown, draw everything grey.
        # Define a graph that is ±INF if the graph is unknown, else 0; and draw it using a grey AREA.
        args.extend([
            "CDEF:var%dun=var%d,UN,%sINF,0,IF" % (srcidx, srcidx, ('-' if invert else '')),
            "AREA:var%dun#88888850:"           % (srcidx),
            ])

        # Now print the graph description table.
        if width >= 350:
            args.extend([
                "GPRINT:var%d:LAST:%%8.2lf%%s"     % srcidx,
                "GPRINT:var%d:MIN:%%8.2lf%%s"      % srcidx,
                "GPRINT:var%d:AVERAGE:%%8.2lf%%s"  % srcidx,
                "GPRINT:var%d:MAX:%%8.2lf%%s\\j"   % srcidx,
                ])
        else:
            args.extend([
                "GPRINT:var%d:LAST:%%8.2lf%%s"        % srcidx,
                "GPRINT:var%d:AVERAGE:%%8.2lf%%s\\j"  % srcidx,
                ])

        # If warn/crit are known, use HRULEs to draw them.
        if warn:
            args.append( "HRULE:%.1f#F0F700" % warn )

        if crit:
            args.append( "HRULE:%.1f#FF0000" % crit )


    def mkdate(text, timestamp):
        return "COMMENT:%-15s %-30s\\j" % (
            text,
            format_date( datetime.fromtimestamp(timestamp), get_date_formats()[1] ).replace(":", "\\:")
            )

    args.extend([
        "COMMENT: \\j",
        mkdate( _("Start time"), start ),
        mkdate( _("End time"),   end   ),
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
                posbg = array(imgout.size) - array(imgbg.size)
                imgout.paste( imgbg, (posbg[0], posbg[1], imgout.size[0], imgout.size[1]), imgbg )
            # now paste the graph
            imgout.paste( imggraph, None, imggraph )
            # save into our "out" variable
            buf = StringIO()
            imgout.save( buf, "PNG" )
            out = buf.getvalue()

    return HttpResponse( out, mimetype="image/png" )

