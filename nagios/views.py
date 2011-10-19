# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import re
from time import time

from django.http       import HttpResponse
from django.shortcuts  import get_object_or_404
from systemd.procutils import invoke

from nagios.conf   import settings as nagios_settings
from nagios.models import Service

def graph(request, service_id, srcidx):
    serv = get_object_or_404(Service, pk=int(service_id))

    perfdata = serv.perfdata[int(srcidx)]

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
    m = re.match( '\d+(?:\.\d+)?([^\d;]+)?(?:;.*)?', perfdata[1] )
    if m and m.group(1):
        args.extend([ "--vertical-label", m.group(1) ])

    args.extend([
        "DEF:var%s=%s:%d:AVERAGE" % (srcidx,
            (nagios_settings.RRD_PATH % serv.description.replace(' ', '_').encode("UTF-8")),
            int(srcidx) + 1),
        "AREA:var%s#%s:%s" % (srcidx, color, perfdata[0])
        ])

    print args

    ret, out, err = invoke(args, log=False, return_out_err=True)

    return HttpResponse( out, mimetype="image/png" )

