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
from os.path  import getmtime
from time     import time
from xml.dom  import minidom

from numpy    import array
from colorsys import rgb_to_hls, hls_to_rgb


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



class Source(object):
    def __init__(self, id, name, perfdata, rrdpath):
        self.id = id
        self.name = name
        self.rrdpath  = rrdpath
        self.title = name

        self.perfdata = perfdata.split(';')
        self.args = []

    @property
    def curr(self):
        m = re.match( '^(?P<value>\d+(?:\.\d+)?)(?:[^\d;]*)$', self.perfdata[0] )
        if m and m.group("value"):
            return float(m.group("value"))
        return None

    @property
    def unit(self):
        m = re.match( '\d+(?:\.\d+)?(?P<unit>[^\d;]+)?(?:;.*)?', self.perfdata[0] )
        if m and m.group("unit"):
            return m.group("unit")
        return None

    @property
    def warn(self):
        if len(self.perfdata) < 2:
            return None
        return self.perfdata[1] and float(self.perfdata[1]) or None

    @property
    def crit(self):
        if len(self.perfdata) < 3:
            return None
        return self.perfdata[2] and float(self.perfdata[2]) or None

    @property
    def vmin(self):
        if len(self.perfdata) < 4:
            return None
        return self.perfdata[3] and float(self.perfdata[3]) or None

    @property
    def vmax(self):
        if len(self.perfdata) < 5:
            return None
        return self.perfdata[4] and float(self.perfdata[4]) or None

    def varnegate(self, var):
        # define the negative graph
        self.args.append( "CDEF:%sneg=%s,-1,*" % (var, var) )
        return "%sneg" % var

    def varlimit(self, varname, statename, vmin=0, vmax=0):
        newvar = varname + statename
        if vmin != "INF": vmin = "%.1f" % vmin
        if vmax != "INF": vmax = "%.1f" % vmax
        self.args.append("CDEF:%s=%s,%s,%s,LIMIT" % (newvar, varname, vmin, vmax))
        return newvar

    def area(self, varname, color, gradient_base=None):
        if gradient_base is not None:
            self.args.extend( get_gradient_args(varname, rgbstr_to_hls(color), gradient_base) )
        else:
            self.args.append("AREA:%s#%s70:" % (varname, color))
        return varname

    def line(self, varname):
        if self.warn and self.crit:
            lineclr = "00AA00"
            if self.curr >= self.warn:
                lineclr = "AAAA00"
            if self.curr >= self.crit:
                lineclr = "AA0000"
        else:
            lineclr = "0000AA"
        # line above everything that holds the description
        self.args.append( "LINE1:%s#%sCC:%s" % (varname, lineclr, self.title) )
        return varname

    def define(self, id, invert=False, stacked=None, gradient_base=None, fulldesc=True):
        """ Create a variable definition for this source and return the name. """
        varname = "var%d" % id
        self.args.append( "DEF:%s=%s:%d:AVERAGE" % (varname, self.rrdpath, self.id) )

        if invert:
            varname = self.varnegate(varname)

        if not stacked:
            self.line(varname)

            if self.warn and self.crit:
                if not invert:
                    self.area(self.varlimit(varname, "ok",         0, self.warn), "00AA00", gradient_base)
                    self.area(self.varlimit(varname, "w",  self.warn, self.crit), "AAAA00", gradient_base)
                    self.area(self.varlimit(varname, "c",  self.crit,     "INF"), "AA0000", gradient_base)
                else:
                    self.area(self.varlimit(varname, "ok", self.warn,         0), "00AA00", gradient_base)
                    self.area(self.varlimit(varname, "w",  self.crit, self.warn), "AAAA00", gradient_base)
                    self.area(self.varlimit(varname, "c",      "INF", self.crit), "AA0000", gradient_base)
                self.args.append( "HRULE:%.1f#F0F700" % self.warn )
                self.args.append( "HRULE:%.1f#FF0000" % self.crit )
            else:
                self.area(varname, "0000AA", gradient_base)

            # In cases where the values are unknown, draw everything grey.
            # Define a graph that is ±INF if the graph is unknown, else 0; and draw it using a grey AREA.
            self.args.extend([
                "CDEF:%sun=%s,UN,%sINF,0,IF" % (varname, varname, ('-' if invert else '')),
                "AREA:%sun#88888850:"        % (varname),
                ])
        else:
            self.args.append("AREA:%s#%sAA:%s:STACK" % (varname, get_hls_for_srcidx(rgbstr_to_hls("0000AA"), id), self.title))

        # Now print the graph description table.
        if fulldesc:
            self.args.extend([
                "GPRINT:%s:LAST:%%8.2lf%%s"     % varname,
                "GPRINT:%s:MIN:%%8.2lf%%s"      % varname,
                "GPRINT:%s:AVERAGE:%%8.2lf%%s"  % varname,
                "GPRINT:%s:MAX:%%8.2lf%%s\\j"   % varname,
                ])
        else:
            self.args.extend([
                "GPRINT:%s:LAST:%%8.2lf%%s"        % varname,
                "GPRINT:%s:AVERAGE:%%8.2lf%%s\\j"  % varname,
                ])

        return self.args



class RRD(object):
    def __init__(self, rrdpath, xmlpath):
        self.rrdpath = rrdpath
        self.xmlpath = xmlpath

        self.xml = minidom.parse(xmlpath)
        # Build a dict that resolves datasource names to datasource IDs
        self.sources = dict( [
            (ds.getElementsByTagName("NAME")[0].childNodes[0].nodeValue,
            int(ds.getElementsByTagName("DS")[0].childNodes[0].nodeValue))
            for ds in self.xml.getElementsByTagName("DATASOURCE")
            ] )

        self.perfdata = dict( [
            pd.split('=', 1) for pd in
            self.xml.getElementsByTagName("NAGIOS_SERVICEPERFDATA")[0].childNodes[0].nodeValue.split(' ')
            ] )

    def get_source(self, srcname):
        return Source( self.sources[srcname], srcname, self.perfdata[srcname], self.rrdpath )

    @property
    def last_check(self):
        try:
            # Stat the RRD file to prevent ugly grey bars on the right side
            # that appear before npcd processed the perfdata
            xmltime = int(self.xml.getElementsByTagName("NAGIOS_TIMET")[0].childNodes[0].nodeValue)
            return min(xmltime, int(getmtime(self.rrdpath)))
        except:
            return int(time())

    @property
    def host_name(self):
        return self.xml.getElementsByTagName("NAGIOS_DISP_HOSTNAME")[0].childNodes[0].nodeValue

    @property
    def service_description(self):
        return self.xml.getElementsByTagName("NAGIOS_DISP_SERVICEDESC")[0].childNodes[0].nodeValue


class Graph(object):
    def __init__(self, rrd, srcline):
        self.rrd    = rrd
        self.srcline = srcline

        # Defaults, set those to what you want before calling get_args
        self.start  = self.rrd.last_check - 24*60*60
        self.end    = self.rrd.last_check
        self.height = 150
        self.width  = 700
        self.bgcol  = "1F2730"
        self.fgcol  = "FFFFFF"
        self.grcol  = "222222"
        self.sacol  = None
        self.sbcol  = None
        self.grad   = False
        self.title  = self.rrd.service_description
        self.args   = None
        self.verttitle = None

        self.sources = {}
        for srcname in self.srcline.split():
            if srcname[0] == '-':
                srcname = srcname[1:]
            self.sources[srcname] = self.rrd.get_source(srcname)

    def get_args(self):
        self.args = [
            "rrdtool", "graph", "-", "--start", str(self.start), "--end", str(self.end),
            "--height", str(self.height), "--width", str(self.width),
            "--imgformat", "PNG", "--title", self.title
            ]
        if self.verttitle is None:
            for src in self.sources.values():
                if src.unit:
                    self.verttitle = src.unit
                    break
        if self.verttitle is not None:
            # if specified or we found one above
            self.args.extend([ "--vertical-label", self.verttitle ])
        if self.bgcol:
            # User wants a background color. Make the background transparent
            # here, so that we can apply the background color and image later.
            self.args.extend([ "--color", "BACK#00000000" ])
        if self.fgcol:
            self.args.extend([ "--color", "FONT#"+self.fgcol ])
        if self.grcol:
            self.args.extend([ "--color", "CANVAS#"+self.grcol ])
        if self.sacol:
            self.args.extend([ "--color", "SHADEA#"+self.sacol ])
        if self.sbcol:
            self.args.extend([ "--color", "SHADEB#"+self.sbcol ])

        # calc the maximum variable name length
        maxlen = max( [ len(src.name) for src in self.sources.values() ] )

        # rrdtool uses \\j for newline.
        self.args.append("COMMENT:  \\j")
        # Print the table titles. First some empty space for where the graph names are...
        self.args.append("COMMENT:  " + (" " * maxlen))
        # ...then the actual titles + space for the unit identifier.
        if self.width >= 350:
            self.args.extend([
                "COMMENT:%8s " % "Cur",
                "COMMENT:%8s " % "Min",
                "COMMENT:%8s " % "Avg",
                "COMMENT:%8s \\j" % "Max",
                ])
        else:
            self.args.extend([
                "COMMENT:%8s " % "Cur",
                "COMMENT:%8s \\j" % "Avg",
                ])

        # Draw an HRULE for the x axis. important for graphs that go +/-.
        self.args.append("HRULE:0#000000")

        if self.grad:
            hlsbg = get_hls_complementary( rgbstr_to_hls( self.grcol ) )
        else:
            hlsbg = None

        stacked = False
        lastinv = None
        srcidx = 0

        for srcname in self.srcline.split():
            invert = False

            if srcname in ('+s', '-s'):
                stacked = (srcname == '+s')
                continue

            if srcname[0] == '-':
                invert = True
                srcname = srcname[1:]

            src = self.sources[srcname]

            self.args.extend(
                src.define(srcidx,
                    invert,
                    stacked and (lastinv == invert),
                    hlsbg,
                    (self.width >= 350))
                )

            lastinv = invert
            srcidx += 1

        return self.args
