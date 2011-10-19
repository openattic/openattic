# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import re
from os.path import exists
from time import time

from django.http       import HttpResponse, Http404
from django.shortcuts  import get_object_or_404
from systemd.procutils import invoke

from nagios.conf   import settings as nagios_settings
from nagios.models import Service

def graph(request, service_id, srcidx):
    serv = get_object_or_404(Service, pk=int(service_id))

    try:
        perfdata = serv.perfdata[int(srcidx)]
    except IndexError:
        raise Http404("Performance data not available")

    rrdpath = nagios_settings.RRD_PATH % serv.description.replace(' ', '_').encode("UTF-8")
    if not exists(rrdpath):
        raise Http404("RRD file not found")

    start  = request.GET.get("start",  str(int(time() - 24*60*60)))
    end    = request.GET.get("end",    str(int(time())))
    height = request.GET.get("height", "150")
    width  = request.GET.get("width",  "700")
    color  = request.GET.get("color",  "00AA00CC")

    args = [
        "rrdtool", "graph", "-", "--start", start, "--end", end, "--height", height,
        "--width", width, "--imgformat", "PNG", "--title", serv.description
        ]

    # Try to match the unit of the current value
    m = re.match( '\d+(?P<value>\.\d+)?(?P<unit>[^\d;]+)?(?:;.*)?', perfdata[1] )
    if m:
        currval = m.group("value")
        if m.group("unit"):
            args.extend([ "--vertical-label", m.group("unit") ])
    else:
        currval = perfdata[1]

    # Max length of the field is currently the length of the only field which we print :)
    maxlen = len(perfdata[0])

    args.extend([
        "COMMENT:" + (" " * maxlen),
        "COMMENT:Cur",
        "COMMENT:Min",
        "COMMENT:Avg",
        "COMMENT:Max\\j",
        ])

    args.extend([
        "DEF:var%s=%s:%d:AVERAGE"     % (srcidx, rrdpath, int(srcidx) + 1),
        "AREA:var%s#%s:%s"            % (srcidx, color, perfdata[0]),
        "GPRINT:var%s:LAST:%%.2lf"    % srcidx,
        "GPRINT:var%s:MIN:%%.2lf"     % srcidx,
        "GPRINT:var%s:AVERAGE:%%.2lf" % srcidx,
        "GPRINT:var%s:MAX:%%.2lf\\j"  % srcidx,
        ])

    perfvalues = perfdata[1].split(';')
    if len(perfvalues) > 1:
        # maybe we have curr;warn;crit;min;max
        warn = perfvalues[1]
        crit = perfvalues[2] if len(perfvalues) > 2 else None
        vmin = perfvalues[3] if len(perfvalues) > 3 else None
        vmax = perfvalues[4] if len(perfvalues) > 4 else None

        if warn is not None:
            args.append( "HRULE:%s#F0F700" % warn )

        if crit is not None:
            args.append( "HRULE:%s#FF0000" % crit )

        if vmin is not None:
            args.extend([ "-l", vmin ])

        if vmax is not None:
            args.extend([ "-u", vmax ])


    #print args

    ret, out, err = invoke(args, log=False, return_out_err=True)

    return HttpResponse( out, mimetype="image/png" )

