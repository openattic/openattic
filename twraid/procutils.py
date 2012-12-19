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

import errno
import re

from systemd.procutils import invoke


class TwRegex:
    ctl         = (r'^(?P<ctl>c\d+)\s+(?P<model>[\w\-]+)\s+(?P<ports>\d+)\s+(?P<drives>\d+)\s+(?P<units>\d+)\s+'
                     '(?P<notopt>\d+)\s+(?P<rrate>\d+)\s+(?P<vrate>\d+)\s+(?P<bbu>\w+|-)$')

    enclosure   = (r'^(?P<encl>/c\d+/e\d+)\s+(?P<slots>\d+)\s+(?P<drives>\d+)\s+(?P<fans>\d+)\s+'
                     '(?P<tsunits>\d+)\s+(?P<psunits>\d+)\s+(?P<alarms>\d+)$')

    ctlparam    = (r'^/(?P<ctl>c\d+)\s(?P<key>[^=]+)=(?P<value>.*)$')

    ctlunit     = (r'^(?P<unit>u\d+)\s+(?P<unittype>[\w\-]+)\s+(?P<status>[\w\-]+)\s+(?P<rcmpl>[\w\-]+)\s+'
                     '(?P<vim>[\w\-]+)\s+(?P<chunksize>[\w\-]+)\s+(?P<totalsize>[\w\.\-]+)\s+(?P<cache>[\w\-]+)\s+(?P<avrfy>[\w\-]+)$')

    ctlport     = (r'^(?P<port>p\d+)\s+(?P<status>[\w\-]+)\s+(?P<unit>(u\d+|-)+)\s+(?P<size>[\w\.\-]+ \w+B)\s+(?P<type>[\w\-]+)\s+'
                     '(?P<phy>[\w\-]+)\s+(?P<slot>/c\d+/e\d+/slt\d+)\s+(?P<model>[\w\s\-]+)$')

    unitparam   = (r'^/(?P<unit>c\d+/u\d+)\s(?P<key>[^=]+)=(?P<value>.*)$')

    unitdisk    = (r'^(?P<unit>u\d+-\d+)\s+DISK\s+(?P<status>[\w\-]+)\s+(?P<rcmpl>[\w\-]+)\s+(?P<vim>[\w\-]+)\s+'
                     '(?P<port>p\d+|-)\s+-\s+\s+(?P<size>[\w\.\-]+)$')



class Bunch(object):
    def __init__(self, data):
        self.__dict__.update(data)

class Controller(Bunch):
    @property
    def id(self):
        return int(self.ctl[1:])

class Enclosure(Bunch):
    @property
    def ctl_id(self):
        return int(re.match("/c(\d+)/e\d+", self.encl).group(1))

class Unit(Bunch):
    @property
    def id(self):
        return int(self.unit[1:])

class Port(Bunch):
    @property
    def id(self):
        return int(self.port[1:])

class Disk(Bunch):
    @property
    def id(self):
        return int(self.unit.split('-')[1])


def query_ctls():
    ctls = {}

    twcli = "tw-cli"
    try:
        ret, out, err = invoke([twcli, "show"], return_out_err=True, log=False)
    except OSError, err:
        print "tw-cli not found"
        if err.errno != errno.ENOENT:
            raise
        # tw-cli was not found. retry using tw_cli, which may or may not work.
        # if it does, use tw_cli from now on.
        twcli = "tw_cli"
        try:
            ret, out, err = invoke([twcli, "show"], return_out_err=True, log=False)
        except OSError, err:
            if err.errno != errno.ENOENT:
                raise
            raise SystemError("tw-cli not installed")

    for line in out.split("\n"):
        line = line.strip()
        if not line:
            continue

        m = re.match(TwRegex.ctl, line)
        if m:
            print "Found controller!", m.groupdict()
            ctl = Controller(m.groupdict())
            ctls[ctl.id] = ctl
            continue

        m = re.match(TwRegex.enclosure, line)
        if m:
            print "Found enclosure!", m.groupdict()
            encl = Enclosure(m.groupdict())
            ctls[encl.ctl_id].enclosure = encl
            continue

    if not ctls:
        return ctls

    for ctl_id, ctl in ctls.items():
        ctl.params = {}
        ctl.units  = {}
        ctl.ports  = {}

        ret, out, err = invoke([twcli, "/" + ctl.ctl, "show", "all"], return_out_err=True, log=False)
        for line in out.split("\n"):
            line = line.strip()
            if not line:
                continue

            m = re.match(TwRegex.ctlparam, line)
            if m:
                print "Found controller property!", m.groupdict()
                ctl.params[ m.group("key").strip() ] = m.group("value").strip()
                continue

            m = re.match(TwRegex.ctlunit, line)
            if m:
                print "Found Unit!", m.groupdict()
                have_units = True
                unit = Unit(m.groupdict())
                ctl.units[unit.id] = unit
                continue

            m = re.match(TwRegex.ctlport, line)
            if m:
                print "Found Port!", m.groupdict()
                port = Port(m.groupdict())
                ctl.ports[port.id] = port
                continue

        if not ctl.units:
            continue

        for unit_id, unit in ctl.units.items():
            unit.params = {}
            unit.disks  = {}

            ret, out, err = invoke([twcli, "/%s/%s" % (ctl.ctl, unit.unit), "show", "all"], return_out_err=True, log=False)
            for line in out.split("\n"):
                line = line.strip()
                if not line:
                    continue

                m = re.match(TwRegex.unitparam, line)
                if m:
                    print "Found unit property!", m.groupdict()
                    unit.params[ m.group("key").strip() ] = m.group("value").strip()
                    continue

                m = re.match(TwRegex.unitdisk, line)
                if m:
                    print "Found Disk!", m.groupdict()
                    disk = Disk(m.groupdict())
                    unit.disks[disk.id] = disk
                    continue

    return ctls

