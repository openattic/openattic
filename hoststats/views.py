# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import statgrab
from datetime import timedelta

from django.shortcuts  import render_to_response
from django.template   import RequestContext

from plotutils         import piechart


def dashboard(request):
    return render_to_response( "stats/dashboard.html", {
        "hostinfo": statgrab.sg_get_host_info(),
        "load":     statgrab.sg_get_load_stats(),
        'uptime':   timedelta( seconds=statgrab.sg_get_host_info()["uptime"] ),
        }, context_instance = RequestContext(request) )

def cpustats(request):
    stat = statgrab.sg_get_cpu_percents()

    return piechart([stat.kernel, stat.idle, stat.user, stat.iowait],
        heading="CPU", explode=[0, 0.05, 0, 0],
        titles = ('Kernel Space', 'Idle', 'User Space', "IOwait"),
        )

def memstats(request):
    stat = statgrab.sg_get_mem_stats()

    return piechart([(stat.used - stat.cache), stat.cache, stat.free],
        heading="Memory", explode=[0.05, 0, 0],
        titles = ('used', 'cache', 'free'),
        )
