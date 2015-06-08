# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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
import math
import subprocess
import tokenize
import hashlib
import logging

from os.path  import getmtime
from time     import time
from xml.dom  import minidom
from datetime import datetime
from StringIO import StringIO

from PIL      import Image
from numpy    import array
from colorsys import rgb_to_hls, hls_to_rgb

from django.utils import formats
from django.utils.translation import ugettext as _

from nagios.conf import settings as nagios_settings


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
    # Take the first byte from the source name's md5 hash * 0.3 and add it to the color.
    # I must admit this sucks to some degree, but I totally lack better ideas right now.
    md5 = hashlib.md5(srcidx).hexdigest()
    h = int( md5[:2], 16 ) * 0.3 + hlsfrom[0]
    if h > 1.0:
        h -= int(h)
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


class Symbol(object):
    lbp = 0
    rbp = 0

    def __init__(self, parser, id_, value):
        # Set defaults for left/right binding power
        self.parser = parser
        self.id = id_
        self.value = value

    def nud(self):
        """ Null Denotation """
        return self

    def led(self, left):
        """ Left Denotation """
        return self

    def get_value(self, rrd):
        raise NotImplementedError("get_value")

class Name(Symbol):
    def get_value(self, rrd):
        return rrd.get_source(self.value)

class EndMarker(Symbol):
    pass

class Literal(Symbol):
    def get_value(self, rrd):
        return LiteralNode(self.value)

class Infix(Symbol):
    def led(self, left):
        self.first = left
        self.second = self.parser.expression(self.rbp)
        return self

class Prefix(Symbol):
    lbp =  0
    rbp = 70

    def nud(self):
        self.first = self.parser.expression(self.rbp)
        return self

class OpPlus(Infix):
    lbp = 50
    rbp = 50

    def get_value(self, rrd):
        return self.first.get_value(rrd) + self.second.get_value(rrd)

class OpMinus(Infix):
    lbp = 50
    rbp = 50

    def nud(self):
        self.first = self.parser.expression(Prefix.rbp)
        self.second = None
        return self

    def get_value(self, rrd):
        if self.second is None:
            return -self.first.get_value(rrd)
        return self.first.get_value(rrd) - self.second.get_value(rrd)

class OpMult(Infix):
    lbp = 60
    rbp = 60

    def get_value(self, rrd):
        return self.first.get_value(rrd) * self.second.get_value(rrd)

class OpDiv(Infix):
    lbp = 60
    rbp = 60

    def get_value(self, rrd):
        return self.first.get_value(rrd) / self.second.get_value(rrd)

class OpStack(Infix):
    lbp = 20
    rbp = 20

    def get_value(self, rrd):
        return self.first.get_value(rrd) ** self.second.get_value(rrd)

class LeftParen(Prefix):
    def nud(self):
        exp = self.parser.expression(0)
        if self.parser.token.id != ')':
            raise ValueError("Missing )")
        self.parser.advance() # skip the )
        return exp

class RightParen(Symbol):
    pass


class Parser(object):
    # http://effbot.org/zone/simple-iterator-parser.htm
    # http://javascript.crockford.com/tdop/tdop.html
    # http://effbot.org/zone/simple-top-down-parsing.htm

    def __init__(self, token_gen):
        self.symbol_table = {
            '(literal)': Literal,
            '(name)':    Name,
            '(end)':     EndMarker,
            '+':         OpPlus,
            '-':         OpMinus,
            '*':         OpMult,
            '/':         OpDiv,
            '**':        OpStack,
            '(':         LeftParen,
            ')':         RightParen,
            }
        self.token = None
        self.token_gen = token_gen
        self.advance()

    def advance(self):
        tokentype, tokenvalue, _, _, _ = self.token_gen.next()
        if tokentype == tokenize.NAME:
            # get variable or something
            symbol = '(name)'
        elif tokentype == tokenize.OP:
            if tokenvalue not in self.symbol_table:
                raise ValueError("Operator '%s' is not defined." % tokenvalue)
            symbol = tokenvalue
        elif tokentype == tokenize.NUMBER:
            try:
                tokenvalue = int(tokenvalue, 0)
            except ValueError:
                tokenvalue = float(tokenvalue)
            symbol = '(literal)'
        elif tokentype == tokenize.ENDMARKER:
            symbol = '(end)'
        else:
            raise ValueError("Unexpected token.")
        SymClass = self.symbol_table[symbol]
        #print "Making a %s(%s, %s)." % (SymClass.__name__, symbol, tokenvalue)
        self.token = SymClass(self, symbol, tokenvalue)
        return self.token

    def expression(self, rbp=0):
        t = self.token
        self.advance()
        left = t.nud()
        while rbp < self.token.lbp:
            t = self.token
            self.advance()
            left = t.led(left)
        return left


def parse(source):
    src = StringIO(source).readline
    src = tokenize.generate_tokens(src)
    parser = Parser(src)
    while True:
        yield parser.expression()



class Node(object):
    def __init__(self):
        self.args = []
        self.invert = False
        self.stacked = False
        self.first_in_stack = False
        self.gradient_base = None
        self.fulldesc = True
        self._label = ""
        self._labelwidth = -1

    @property
    def labelwidth(self):
        if self._labelwidth == -1:
            return len(self._label)
        else:
            return self._labelwidth

    @labelwidth.setter
    def labelwidth(self, value):
        self._labelwidth = value

    @property
    def label(self):
        text = self._label.strip()
        if self._labelwidth != -1 and len(self._label) > self._labelwidth:
            text = text[:self._labelwidth - 1] + u'…'
        return "%-*s" % (self._labelwidth, text)

    @label.setter
    def label(self, value):
        self._label = value

    def copy_graphvars(self, other):
        other.invert   = self.invert
        other.fulldesc = self.fulldesc
        other.stacked  = self.stacked
        other.first_in_stack = self.first_in_stack
        other.gradient_base  = self.gradient_base

    def __add__(self, other):
        return AddNode(self, other)

    def __sub__(self, other):
        return SubstractNode(self, other)

    def __neg__(self):
        return UpsideDownNode(self)

    def __mul__(self, other):
        return MultiplyNode(self, other)

    def __div__(self, other):
        return DivideNode(self, other)

    def __truediv__(self, other):
        return DivideNode(self, other)

    def __pow__(self, other):
        return StackNode(self, other)

    warn = None
    crit = None

    def varlimit(self, varname, statename, vmin=0, vmax=0):
        newvar = varname + statename
        if vmin not in ("-INF", "INF"): vmin = "%.1f" % vmin
        if vmax not in ("-INF", "INF"): vmax = "%.1f" % vmax
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
        self.args.append( "LINE1:%s#%sCC:%s" % (varname, lineclr, self.label) )

    def graph(self):
        self._draw_graph(self.varname)
        self._draw_table(self.varname)

    def _draw_graph(self, varname):
        if not self.stacked:
            self.line(varname)

            if self.warn and self.crit:
                if not self.invert:
                    self.area(self.varlimit(varname, "ok",          0,  self.warn), "00AA00", self.gradient_base)
                    self.area(self.varlimit(varname, "w",   self.warn,  self.crit), "AAAA00", self.gradient_base)
                    self.area(self.varlimit(varname, "c",   self.crit,      "INF"), "AA0000", self.gradient_base)
                else:
                    self.area(self.varlimit(varname, "ok", -self.warn,          0), "00AA00", self.gradient_base)
                    self.area(self.varlimit(varname, "w",  -self.crit, -self.warn), "AAAA00", self.gradient_base)
                    self.area(self.varlimit(varname, "c",      "-INF", -self.crit), "AA0000", self.gradient_base)
                self.args.append( "HRULE:%.1f#F0F700" % self.warn )
                self.args.append( "HRULE:%.1f#FF0000" % self.crit )
            else:
                self.area(varname, "0000AA", self.gradient_base)

            # In cases where the values are unknown, draw everything grey.
            # Define a graph that is ±INF if the graph is unknown, else 0; and draw it using a grey AREA.
            self.args.extend([
                "CDEF:%sun=%s,UN,%sINF,0,IF" % (varname, varname, ('-' if self.invert else '')),
                "AREA:%sun#88888850:"        % (varname),
                ])
        else:
            color = hls_to_rgbstr(get_hls_for_srcidx(rgbstr_to_hls("0000AA"), varname)) + 'AA'
            stackarg = "AREA:%s#%s:%s" % (varname, color, self.label)
            if not self.first_in_stack:
                stackarg += ":STACK"
            self.args.append(stackarg)

    def _draw_table(self, varname):
        # Now print the graph description table.
        if self.fulldesc:
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


class MathNode(Node):
    op = '_'
    opstr = 'overrideme'

    def __init__(self, lft, rgt):
        Node.__init__(self)
        self.lft = lft
        self.rgt = rgt
        self.varlft = None
        self.varrgt = None
        if lft and rgt:
            self._label = "%s %s %s" % (self.lft.label, self.op, self.rgt.label)
        else:
            self._label = "override me"

    curr = property( lambda self: self.lft.curr )
    unit = property( lambda self: self.lft.unit )
    warn = property( lambda self: self.lft.warn )
    crit = property( lambda self: self.lft.crit )
    vmin = property( lambda self: self.lft.vmin )
    vmax = property( lambda self: self.lft.vmax )

    labelwidth = Node.labelwidth

    @labelwidth.setter
    def labelwidth(self, value):
        self._labelwidth = value
        if self.lft is not None:
            self.lft.labelwidth = value
        if self.rgt is not None:
            self.rgt.labelwidth = value

    @property
    def varname(self):
        return "%s_%s_%s" % (self.lft.varname.replace('.', '_'), self.opstr, self.rgt.varname.replace('.', '_'))

    def define(self):
        self.lft.args = self.args
        self.lft.define()
        self.rgt.args = self.args
        self.rgt.define()
        self.args.append( "CDEF:%s=%s,%s,%s" % (self.varname, self.lft.varname, self.rgt.varname, self.op) )


class StackNode(MathNode):
    @property
    def labelwidth(self):
        return max(
            self.lft.labelwidth if self.lft is not None else 0,
            self.rgt.labelwidth if self.rgt is not None else 0)

    @labelwidth.setter
    def labelwidth(self, value):
        if self.lft is not None:
            self.lft.labelwidth = value
        if self.rgt is not None:
            self.rgt.labelwidth = value

    def define(self):
        self.lft.args = self.args
        self.varlft = self.lft.define()
        self.rgt.args = self.args
        self.varrgt = self.rgt.define()

    def graph(self):
        self.copy_graphvars(self.lft)
        self.lft.stacked = True
        self.lft.first_in_stack = not isinstance(self.lft, StackNode)
        self.lft.graph()

        self.copy_graphvars(self.rgt)
        self.rgt.stacked = True
        self.rgt.first_in_stack = False
        self.rgt.graph()


class UpsideDownNode(MathNode):
    def __init__(self, lft):
        MathNode.__init__(self, lft, None)
        self._label = self.lft.label

    varname = property( lambda self: self.lft.varname + "neg" )

    def define(self):
        self.lft.args = self.args
        self.lft.define()
        self.args.append( "CDEF:%s=%s,-1,*" % (self.varname, self.lft.varname) )

    def graph(self):
        self.copy_graphvars(self.lft)
        self._draw_graph(self.varname)
        self._draw_table(self.lft.varname)


class AddNode(MathNode):
    op = '+'
    opstr = 'plus'

class SubstractNode(MathNode):
    op = '-'
    opstr = 'minus'

class MultiplyNode(MathNode):
    op = '*'
    opstr = 'times'

class DivideNode(MathNode):
    op = '/'
    opstr = 'div'


class LiteralNode(Node):
    def __init__(self, value):
        Node.__init__(self)
        self._value = value
        self._label = unicode(value)

    varname    = property( lambda self: unicode(self._value) )

    def define(self):
        pass


class Source(Node):
    def __init__(self, rrd, name):
        Node.__init__(self)
        self.name = name
        self.varname = name
        self.rrd  = rrd
        self._label = self.rrd.get_source_label(name).strip()

        self.perfdata = self.rrd.get_source_perfdata(name).split(';')
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

    def define(self):
        """ Create a variable definition for this source and return the name. """
        varname = self.name
        self.args.append( "DEF:%s=%s:%s:AVERAGE" % (varname, self.rrd.get_source_rrdpath(self.name), self.rrd.get_source_varname(self.name)) )
        return varname



class RRD(object):
    def __init__(self, xmlpath):
        self.xmlpath = xmlpath

        self.xml = minidom.parse(xmlpath)
        # Build a dict that resolves datasource names to datasource IDs
        self.sources = dict( [
            (ds.getElementsByTagName("NAME")[0].childNodes[0].nodeValue,
            int(ds.getElementsByTagName("DS")[0].childNodes[0].nodeValue))
            for ds in self.xml.getElementsByTagName("DATASOURCE")
            ] )

        self.rrdpaths = dict( [
            (ds.getElementsByTagName("NAME")[0].childNodes[0].nodeValue,
            ds.getElementsByTagName("RRDFILE")[0].childNodes[0].nodeValue)
            for ds in self.xml.getElementsByTagName("DATASOURCE")
            ] )

        self.source_labels = dict( [
            (ds.getElementsByTagName("NAME")[0].childNodes[0].nodeValue,
             ds.getElementsByTagName("LABEL")[0].childNodes[0].nodeValue)
            for ds in self.xml.getElementsByTagName("DATASOURCE")
            ] )

        self.perfdata = dict( [
            pd.split('=', 1) for pd in
            self.xml.getElementsByTagName("NAGIOS_SERVICEPERFDATA")[0].childNodes[0].nodeValue.split(' ')
            if '=' in pd
            ] )

    def get_source(self, srcname):
        return Source( self, srcname )

    def get_source_varname(self, srcname):
        return self.sources[srcname]

    def get_source_rrdpath(self, srcname):
        return self.rrdpaths[srcname]

    def get_source_label(self, srcname):
        return self.source_labels[srcname]

    def get_source_perfdata(self, srcname):
        return self.perfdata[self.source_labels[srcname]]

    @property
    def last_check(self):
        try:
            # Stat the RRD file to prevent ugly grey bars on the right side
            # that appear before npcd processed the perfdata
            return int(self.xml.getElementsByTagName("NAGIOS_TIMET")[0].childNodes[0].nodeValue)
        except:
            return int(time())

    @property
    def host_name(self):
        return self.xml.getElementsByTagName("NAGIOS_DISP_HOSTNAME")[0].childNodes[0].nodeValue

    @property
    def service_description(self):
        return self.xml.getElementsByTagName("NAGIOS_DISP_SERVICEDESC")[0].childNodes[0].nodeValue

    def fetch(self, srcname, start, end):
        args = [
            "rrdtool", "fetch", "--start", str(int(start)), "--end", str(int(end)),
            self.rrdpaths[srcname], "AVERAGE"
        ]
        #print '"' + '" "'.join(args).encode("utf-8") + '"'
        rrdtool = subprocess.Popen([arg.encode("utf-8") for arg in args],
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   cwd=nagios_settings.RRD_BASEDIR, env={"LANG": "C"})
        out, err = rrdtool.communicate()
        if err:
            logging.error('"' + '" "'.join(self.args).encode("utf-8") + '"')
            logging.error(err)

        # RRDtool will now dump all data in the given rrd, regardless of source.
        # So maybe we get only the source we asked for or maybe we get everything,
        # depending on the PNP template.
        #
        # Format:
        #                1           2           3
        # <empty line>
        # timestamp      0.1234e5    0.1234e5    0.1234e5

        values = []
        parsing_values = False
        datacolumns = []
        for line in out.split("\n"):
            if not line:
                if not parsing_values:
                    parsing_values = True
                continue

            if not parsing_values:
                dsnames = line.split()
                if len(dsnames) == 1:
                    datacolumns.append(srcname)
                else:
                    for dsname in dsnames:
                        # find out which srcname belongs to this ds name
                        for rrd_srcname, rrd_dsname in self.sources.iteritems():
                            if str(rrd_dsname) == dsname:
                                datacolumns.append(rrd_srcname)

            else:
                timestamp, data = line.split(": ")
                data_values = data.split()
                if max([ math.isnan(float(dv)) for dv in data_values ]):
                    continue
                values.append(dict(
                    zip(datacolumns, [ float(dv) for dv in data_values ]),
                    t = int(timestamp)
                ) )

        return values


class Graph(object):
    def __init__(self):
        # Defaults, set those to what you want before calling get_args
        self.end    = time()
        self.start  = self.end - 24*60*60
        self.height = 150
        self.width  = 700
        self.bgcol  = "FFFFFF"
        self.fgcol  = "111111"
        self.grcol  = "EEEEEE"
        self.sacol  = "FFFFFF"
        self.sbcol  = "FFFFFF"
        self.grad   = False
        self.title  = "Untitled Service"
        self.args   = None
        self.verttitle = None
        self.bgimage = None

        self.sources = []

    def add_source(self, source):
        self.sources.append(source)
        return self

    def get_image(self):
        # the following str(int(self.start)) construct is necessary because RRDtool needs those
        # timestamps to be parseable into ints, and subprocess.Popen needs the args to be strings.
        self.args = [
            "rrdtool", "graph", "-", "--start", str(int(self.start)), "--end", str(int(self.end)),
            "--height", str(self.height), "--width", str(self.width),
            "--imgformat", "PNG", "--title", self.title
            ]
        if nagios_settings.RRDCACHED_SOCKET:
            self.args.extend(["--daemon", nagios_settings.RRDCACHED_SOCKET])
        if self.verttitle is None:
            for src in self.sources:
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

        # calc the maximum variable label length
        maxlen = max( [ src.labelwidth for src in self.sources ] )
        if self.width < 350:
            # we need about 70px for labels and colored dots and margins and stuff, so
            # that leaves (self.width - 70)px for drawing letters. each of those is about
            # 10px wide, so we get to draw a total of...
            maxlen = (self.width - 70) // 10

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

        for src in self.sources:
            src.args = self.args
            src.define()

        for src in self.sources:
            src.labelwidth = maxlen
            src.fulldesc = (self.width >= 350)
            if self.grad:
                src.gradient_base = hlsbg
            src.graph()

        def mkdate(text, timestamp):
            return "COMMENT:%-15s %-30s\\j" % (
                text,
                formats.localize( datetime.fromtimestamp(timestamp) ).replace(":", "\\:")
                )

        self.args.extend([
            "COMMENT: \\j",
            mkdate( _("Start time"), self.start ),
            mkdate( _("End time"),   self.end   ),
            ])

        #print '"' + '" "'.join(self.args).encode("utf-8") + '"'
        rrdtool = subprocess.Popen([arg.encode("utf-8") for arg in self.args],
                                   stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                   cwd=nagios_settings.RRD_BASEDIR)
        out, err = rrdtool.communicate()
        if err:
            logging.error('"' + '" "'.join(self.args).encode("utf-8") + '"')
            logging.error(err)

        if self.bgcol:
            # User wants a background color, so we made the image transparent
            # before. Now is the time to fix that.
            rgbbg    = rgbstr_to_rgb_int( self.bgcol )
            imggraph = Image.open(StringIO(out))
            if imggraph.mode == "RGBA":
                # Create a new image that has our desired background color
                imgout   = Image.new( imggraph.mode, imggraph.size, rgbbg )
                # Maybe paste the background image into it
                if self.bgimage:
                    imgbg = Image.open(self.bgimage)
                    # position the background image at the bottom right
                    posbg = array(imgout.size) - array(imgbg.size) - array((15, 15))
                    imgout.paste( imgbg, (posbg[0], posbg[1], imgout.size[0] - 15, imgout.size[1] - 15), imgbg )
                # now paste the graph
                imgout.paste( imggraph, None, imggraph )
                # save into our "out" variable
                buf = StringIO()
                imgout.save( buf, "PNG" )
                out = buf.getvalue()

        return out
