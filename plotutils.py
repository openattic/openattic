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

from django.http       import HttpResponse
from django.conf       import settings

def piechart(fracs, heading=None, titles=None, legend=None, explode=None, colors=None):
    import os
    if not os.path.exists(settings.MPLCONFIGDIR):
        os.makedirs(settings.MPLCONFIGDIR)
    os.environ["MPLCONFIGDIR"] = settings.MPLCONFIGDIR

    import matplotlib
    import matplotlib.cbook
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas

    fig = plt.Figure()
    fig.patch.set_alpha(0)
    canvas = FigureCanvas(fig)
    ax = fig.add_subplot(111)
    ax.patch.set_alpha(0)

    if heading:
        ax.set_title(heading)

    if colors is None:
        colors = ('#B3DBA2', '#DB6D7C', '#F9F9B8', '#DDDEFF', )

    patches = ax.pie(fracs, explode=explode, autopct='%1.1f%%', shadow=True, colors=colors)

    if titles:
        ax.legend(patches[0], titles, loc=(0,-.05))

    canvas.draw()

    resp = HttpResponse(mimetype="image/png")
    canvas.print_png(resp, transparent=True)
    return resp
