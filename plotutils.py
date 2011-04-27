# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

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
