# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import re
from os.path import exists
from time import time

from django.http       import HttpResponse, Http404
from django.shortcuts  import get_object_or_404
from systemd.procutils import invoke

from nagios.conf   import settings as nagios_settings
from nagios.models import Service, Graph

def graph(request, service_id, srcidx):
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

    start  = request.GET.get("start",  str(int(time() - 24*60*60)))
    end    = request.GET.get("end",    str(int(time())))
    height = int(request.GET.get("height", 150))
    width  = int(request.GET.get("width",  700))

    graphtitle = serv.description
    if graph is not None and width >= 350:
        graphtitle += ' - ' + graph.title

    args = [
        "rrdtool", "graph", "-", "--start", start, "--end", end, "--height", str(height),
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

    # Calc the maximum length required in the Graph name colum to be able to make it wide enough.
    # See the "for" loop below for that if statement. boils down to "get x if index == -x else index"
    maxlen = max( [ len( perfdata[ int(srcidx[1:]) if srcidx[0] == '-' else int(srcidx) ][0] )
                    for srcidx in indexes ] )

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
        # maybe we have curr;warn;crit;min;max; get them and auto-convert if needed
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
            # LIMIT the graphs so everything from 0 to WARN is green, warn to crit is yellow, > crit is red.
            if not invert:
                # purple line above everything that holds the description
                args.append("LINE1:var%d#AA00AACC:%-*s"         % (srcidx, maxlen, graphname))
                # LIMIT 0 < value < warn
                args.append("CDEF:var%dok=var%d,0,%.1f,LIMIT"   % (srcidx, srcidx, warn))
                args.append("AREA:var%dok#00AA0050:"            % (srcidx))
                # LIMIT warn < value < crit
                args.append("CDEF:var%dw=var%d,%.1f,%.1f,LIMIT" % (srcidx, srcidx, warn, crit))
                args.append("AREA:var%dw#AAAA0050:"             % (srcidx))
                # LIMIT crit < value < \infty
                args.append("CDEF:var%dc=var%d,%.1f,INF,LIMIT"  % (srcidx, srcidx, crit) )
                args.append("AREA:var%dc#AA000050:"             % (srcidx))
            else:
                # values are negative here, so we have to match inverted!
                args.extend([
                    # purple line above everything that holds the description
                    "CDEF:var%dneg=var%d,-1,*"                % (srcidx, srcidx),
                    "LINE1:var%dneg#AA00AACC:%-*s"            % (srcidx, maxlen, graphname),
                    # LIMIT 0 > value > warn
                    "CDEF:var%dnegok=var%dneg,%.1f,0,LIMIT"   % (srcidx, srcidx, warn),
                    "AREA:var%dnegok#00AA0050:"               % (srcidx),
                    # LIMIT warn > value > crit
                    "CDEF:var%dnegw=var%dneg,%.1f,%.1f,LIMIT" % (srcidx, srcidx, crit, warn),
                    "AREA:var%dnegw#AAAA0050:"                % (srcidx),
                    # LIMIT crit > value > -\infty
                    "CDEF:var%dnegc=var%dneg,INF,%.1f,LIMIT"  % (srcidx, srcidx, crit),
                    "AREA:var%dnegc#AA000050:"                % (srcidx),
                ])
        else:
            # We don't know warn and crit, so use a blue color.
            if not invert:
                args.append("AREA:var%d#0000AA50:"      % (srcidx))
                args.append("LINE1:var%d#0000AACC:%-*s" % (srcidx, maxlen, graphname))
            else:
                args.extend([
                    "CDEF:var%dneg=var%d,-1,*"        % (srcidx, srcidx),
                    "AREA:var%dneg#0000AA50:"         % (srcidx),
                    "LINE1:var%dneg#0000AACC:%-*s"    % (srcidx, maxlen, graphname),
                ])

        # Now print the grap description table.
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


    #print args

    ret, out, err = invoke(args, log=False, return_out_err=True)

    return HttpResponse( out, mimetype="image/png" )

