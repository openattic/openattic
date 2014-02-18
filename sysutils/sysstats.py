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

import re
from time import sleep

def get_cpu_stats():
    # read /proc/stat
    with open("/proc/stat", "r") as fd:
        sys_stats = [ line.split() for line in fd ]

    # Count CPUs
    cpumax = 0
    for stats in sys_stats[1:]:
        if stats[0].startswith("cpu"):
            cpuidx = int(stats[0][3:])
            cpumax = max(cpumax, cpuidx)
    cpucount = cpumax + 1

    cpu_stats = sys_stats[0]

    fields = ["cpu", "user", "nice", "system", "idle"]

    if len(cpu_stats) > 5:
        fields.extend(["iowait", "irq", "softirq"])

    if len(cpu_stats) > 8:
        fields.append("steal")

    if len(cpu_stats) > 9:
        fields.append("guest")

    if len(cpu_stats) > 10:
        fields.append("guestnice")

    stats = dict( zip( fields, cpu_stats ) )
    del stats["cpu"]

    return stats

def get_cpu_percent(inter=1):
    first = get_cpu_stats()
    sleep(inter)
    secnd = get_cpu_stats()
    diff  = dict([(key, float(secnd[key]) - float(first[key])) for key in first])
    summe = sum(diff.values())
    return dict([(key, diff[key] / summe * 100) for key in first])

def get_system_boot_time():
    """Return the system boot time expressed in seconds since the epoch."""
    with open('/proc/stat', 'r') as fd:
        for line in fd:
            if line.startswith('btime'):
                return float(line.strip().split()[1])
        raise ValueError("btime not found in /proc/stat")

def get_meminfo():
    rgx = re.compile(r"^(?P<key>[\w\(\)_]+):\s+(?P<val>\d+)(\s+kB)?$")

    info = []
    with open("/proc/meminfo", "r") as fd:
        for line in fd:
            m = rgx.match(line.strip())
            if m is not None:
                info.append((m.group("key"), int(m.group("val"))))
    return dict(info)
