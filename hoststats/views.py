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
