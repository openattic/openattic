# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import statgrab

from plotutils         import piechart

def cpustats(request):
    stat = statgrab.sg_get_cpu_percents()

    return piechart([stat.kernel, stat.idle, stat.user, stat.iowait],
        heading="CPU", explode=[0, 0.05, 0, 0],
        titles = ('Kernel Space', 'Idle', 'User Space', "IOwait"),
        colors = ('#DB6D7C', '#B3DBA2', '#F9F9B8', '#DDDEFF', )
        )

def memstats(request):
    stat = statgrab.sg_get_mem_stats()

    return piechart([(stat.used - stat.cache), stat.cache, stat.free],
        heading="Memory", explode=[0.05, 0, 0],
        titles = ('used', 'cache', 'free'),
        colors = ('#DB6D7C', '#F9F9B8', '#B3DBA2', )
        )
