# -*- coding: utf-8 -*-
# kate: hl python; space-indent on; indent-width 4; replace-tabs on;


import os
import sys
import time
import json
import pyudev
import django

from collections import Counter

# from cgi import parse_qs  # Deprecated
from urlparse import parse_qs

# setup Django
from os.path import dirname, abspath

PROJECT_ROOT = dirname(abspath(__file__))

# environment variables
sys.path.insert(0, PROJECT_ROOT)
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

# init Django
try:
    django.setup()
except AttributeError:
    pass

# now we can use the openattic backend, for example
# from ifconfig.models import Host
# current_host = Host.objects.get_current()
from volumes.models import PhysicalBlockDevice


def application(environ, start_response):
    status = '200 OK'

    if not environ["PATH_INFO"].startswith('/stream'):
        headers = [('Content-type', 'text/html; encoding=utf8')]
        start_response(status, headers)
        yield sse_data
        return

    else:
        headers = [('Content-type', 'text/event-stream; encoding=utf8'), ('Cache-Control', 'no-cache')]
        start_response(status, headers)

        # Set client-side auto-reconnect timeout, ms.
        yield 'retry: 100\n\n'

        # Dict filled with system stats
        system_stats = {"cpu": {}, "disks": {}, "network": {}, "temperature": {}, "sys": {}, "timestamp": 0,
                        "debug": {}}

        # Dict filled with system stats from the last and the current call
        data = {}

        # Collect server stats and wait 1 seconds
        last = time.time()
        data["cpu_stats_old"] = get_cpu_time()
        data["disk_stats_old"] = get_disk_stats()
        data["network_stats_old"] = get_network_stats()
        time.sleep(1)

        # Keep connection alive no more then... (s)
        request_get_params = parse_qs(environ.get("QUERY_STRING", ""))
        itv = int(request_get_params.get("interval", ["1"])[0])  # interval in seconds, should be 1
        now = time.time()
        start = now
        end = now + 600
        while now < end:
            if now >= last + itv:
                # Collect stats
                data["cpu_stats_now"] = get_cpu_time()
                data["disk_stats_now"] = get_disk_stats()
                data["network_stats_now"] = get_network_stats()
                uptime = get_uptime()

                # Time
                system_stats["timestamp"] = now
                interval = now - last

                # CPU stats
                total = wrapdiff(data["cpu_stats_now"]["cpu"]["total"], data["cpu_stats_old"]["cpu"]["total"])
                idle = wrapdiff(data["cpu_stats_now"]["cpu"]["idle"], data["cpu_stats_old"]["cpu"]["idle"])
                system_stats["cpu"].update({"load_percent": (total - idle) / total * 100})

                # disk stats
                bytes_per_sector = 512
                tot_ticks = wrapdiff(data["disk_stats_now"]["disks"]["tot_ticks"],
                                     data["disk_stats_old"]["disks"]["tot_ticks"])
                tot_wr_bps = wrapdiff(data["disk_stats_now"]["disks"]["wr_sectors"],
                                      data["disk_stats_old"]["disks"]["wr_sectors"]) / interval * bytes_per_sector
                tot_wr_b = wrapdiff(data["disk_stats_now"]["disks"]["wr_sectors"],
                                    data["disk_stats_old"]["disks"]["wr_sectors"]) * bytes_per_sector
                disks_size = data["disk_stats_now"]["disks"]["block_size"] * bytes_per_sector
                try:
                    util_percent = (tot_ticks / (interval * 1000.) * 100.) / data["disk_stats_now"]["disks"]["count"]
                except ZeroDivisionError:
                    util_percent = "NaN"

                system_stats["disks"].update({"count": data["disk_stats_now"]["disks"]["count"],
                                              "count_online": data["disk_stats_now"]["disks"]["count_online"],
                                              "count_oa_disks": data["disk_stats_now"]["disks"]["count_oa_disks"],
                                              "load_percent": util_percent, "size_byte": disks_size,
                                              "wr_b": tot_wr_b,
                                              "wr_mb": tot_wr_bps / float(1024 ** 2),
                                              "wr_b_per_day": tot_wr_bps * 86400,
                                              "wr_tb_per_day": (tot_wr_bps / float(1024 ** 4)) * 86400})

                # network
                tot_bytes_received = wrapdiff(data["network_stats_now"]["interfaces"]["received"]["bytes"],
                                              data["network_stats_old"]["interfaces"]["received"]["bytes"])
                tot_bytes_transmitted = wrapdiff(data["network_stats_now"]["interfaces"]["transmitted"]["bytes"],
                                                 data["network_stats_old"]["interfaces"]["transmitted"]["bytes"])
                tot_speed = data["network_stats_now"]["interfaces"]["speed"]
                tot_bytes = tot_bytes_received + tot_bytes_transmitted
                if tot_speed > 0:
                    traffic_percent = (tot_bytes / float(1024 ** 2)) / tot_speed * 100
                else:
                    traffic_percent = "NaN"

                system_stats["network"].update({"count": data["network_stats_now"]["interfaces"]["count"],
                                                "tot_rb_in_mb": tot_bytes_received / (1024 ** 2),
                                                "tot_tb_in_mb": tot_bytes_transmitted / (1024 ** 2),
                                                "tot_in_mb": tot_bytes / (1024 ** 2),
                                                "traffic_percent": traffic_percent})

                # sys
                system_stats["sys"].update({"uptime": uptime['uptime']})

                # temperature
                # /sys/class/hwmmon/hwmon*/temp*_input

                # Update old stats
                data["cpu_stats_old"] = data["cpu_stats_now"]
                data["disk_stats_old"] = data["disk_stats_now"]
                data["network_stats_old"] = data["network_stats_now"]

                last = now
                yield "id: %i\n" % (start)
                yield "event: serverstats\n"
                yield "data: %s\n\n" % (json.dumps(system_stats))  # do not change this line
            time.sleep(1)
            now = time.time()


def get_cpu_time():
    """
    @return dict cpu information

    load from /proc/stat
         user    nice   system  idle      iowait irq   softirq  steal  guest  guest_nice
    cpu  74608   2520   24433   1117073   6176   4054  0        0      0      0
    """
    cpu_info = {}
    with open("/proc/stat", "r") as cpu_stat:
        lines = [line.split() for line in cpu_stat.readlines() if line.startswith('cpu')]

        # compute for every cpu
        for cpu_line in lines:
            cpu_line = [cpu_line[0]] + [float(i) for i in cpu_line[1:]]  # type casting
            cpu_id, user, nice, system, idle, iowait, irq, softrig, steal, guest, guest_nice = cpu_line

            idle = idle + iowait
            non_idle = user + nice + system + irq + softrig + steal
            total = idle + non_idle

            cpu_info.update({cpu_id: {'total': total, 'idle': idle, 'non_idle': non_idle}})
        return cpu_info


def get_disk_stats():
    """
    @return dict disk stats (e.g. size, ios ...)
    """
    disk_stats = {}
    disk_count = 0
    ctx = pyudev.Context()

    for dev in ctx.list_devices():
        # filter devices
        if ("MAJOR" not in dev or int(dev["MAJOR"].strip("\0")) != 8) and "virtio" not in dev.device_path:
            continue
        if "MINOR" not in dev or int(dev["MINOR"].strip("\0")) % 16 != 0:
            continue
        if int(dev.attributes["size"].strip("\0")) == 0:
            continue

        disk_count += 1

        with open("/sys/class/block/{}/stat".format(dev.sys_name), "r") as disk_stat:
            data = disk_stat.read().split()
            data = [float(i) for i in data]  # type casting
            (rd_ios, rd_merges, rd_sectors, rd_ticks, wr_ios, wr_merges, wr_sectors, wr_ticks, ios_in_prog, tot_ticks,
             rq_ticks) = data
            disk_stats.update({dev.sys_name: {"rd_ios": rd_ios, "rd_merges": rd_merges, "rd_sectors": rd_sectors,
                                              "rd_ticks": rd_ticks, "wr_ios": wr_ios, "wr_merges": wr_merges,
                                              "wr_sectors": wr_sectors, "wr_ticks": wr_ticks,
                                              "ios_in_prog": ios_in_prog, "tot_ticks": tot_ticks,
                                              "rq_ticks": rq_ticks}})

        with open("/sys/class/block/{}/size".format(dev.sys_name), "r") as disk_size:
            disk_stats[dev.sys_name].update({"block_size": int(disk_size.read().split()[0])})

    disk_sum = Counter()
    for disk in disk_stats.values():
        disk_sum.update(disk)

    # Count sys disks
    sys_disks = 0
    sys_disks_online = 0
    for pbd in PhysicalBlockDevice.objects.all():
        sys_disks += 1
        status = pbd.device.get_status()[0]
        if status == "online" or status == "locked":
            sys_disks_online += 1

    disk_stats.update({u"disks": dict(disk_sum)})
    disk_stats["disks"].update({"count": sys_disks, "count_online": sys_disks_online, "count_oa_disks": disk_count})

    return disk_stats


def get_network_stats():
    """
    @ return dict network stats for all your interfaces, excluding loop
    """
    network_stats = {}
    interface_count = 0
    ctx = pyudev.Context()

    # collecting network interfaces and their speed
    for dev in ctx.list_devices(subsystem='net'):
        if dev.attributes["operstate"] == "up" and dev.sys_name != "lo":
            try:
                speed = float(dev.attributes["speed"])  # is not defined on VMs
            except KeyError:
                speed = 0

            network_stats.update({dev.sys_name: {"status": dev.attributes["operstate"], "speed": speed}})

    # collecting more stats
    for dev in network_stats:
        interface_path = "/sys/class/net/{}/statistics".format(dev)
        with open("{}/rx_bytes".format(interface_path), "r") as net_stat:
            rx_bytes = net_stat.readline().split()[0]
        with open("{}/rx_packets".format(interface_path), "r") as net_stat:
            rx_packets = net_stat.readline().split()[0]
        with open("{}/tx_bytes".format(interface_path), "r") as net_stat:
            tx_bytes = net_stat.readline().split()[0]
        with open("{}/tx_packets".format(interface_path), "r") as net_stat:
            tx_packets = net_stat.readline().split()[0]

        interface_count += 1
        network_stats[dev].update({"received":    Counter({"bytes": float(rx_bytes), "packets": float(rx_packets)}) })
        network_stats[dev].update({"transmitted": Counter({"bytes": float(tx_bytes), "packets": float(tx_packets)}) })

    net_sum = Counter()
    for interface in network_stats.values():
        net_sum.update(interface)

    network_stats.update({u"interfaces": dict(net_sum)})
    network_stats["interfaces"].update({"count": interface_count})
    del network_stats["interfaces"]["status"]

    return network_stats


def get_uptime():
    """
    @return dict up and idletime of your server in seconds
    """
    uptime = {}

    with open("/proc/uptime", "r") as up_stat:
        data = up_stat.read().split()
        data = [float(i) for i in data]
        up, idle = data
        uptime.update({"uptime": up, "idle": idle})

    return uptime


def wrapdiff(curr, last):
    """ Calculate the difference between last and curr.

        If last > curr, try to guess the boundary at which the value must have wrapped
        by trying the maximum values of 64, 32 and 16 bit signed and unsigned ints.
    """
    if last <= curr:
        return curr - last

    boundary = None
    for chkbound in (64, 63, 32, 31, 16, 15):
        if last > 2 ** chkbound:
            break
        boundary = chkbound
    if boundary is None:
        raise ArithmeticError("Couldn't determine boundary")
    return 2 ** boundary - last + curr


sse_data = """
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8" />
        <script src="http://cdnjs.cloudflare.com/ajax/libs/jquery/1.8.3/jquery.min.js "></script>
        <script>
            $(document).ready(function() {
                var es = new EventSource("stream" + location.search);
                es.addEventListener("serverstats", function (e) {
                    var data = JSON.parse(e.data);
                    console.log(e.data);
                    var date = new Date(data.timestamp*1000);
                    var seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
                    var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
                    var hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
                    var time = "<td>" + hours + ':' + minutes + ':' + seconds + "</td>";
                    var uptime_d = Math.floor(data.sys.uptime / 86400);
                    var uptime_h = Math.floor((data.sys.uptime % 86400) / 3600);
                    var uptime_m = Math.floor(((data.sys.uptime % 86400) % 3600) / 60);
                    var uptime = "<td>" + uptime_d + 'D ' + uptime_h + 'H ' + uptime_m + 'M' + "</td>";
                    var cpu_load = "<td>" + data.cpu.load_percent + "</td>";
                    var disks = "<td>" + data.disks.count_oa_disks + "</td>";
                    var disks_online = "<td>" + data.disks.count_online + '/' + data.disks.count + "</td>";
                    var disk_load = "<td>" + data.disks.load_percent + "</td>";
                    var disk_wr_mb = "<td>" + data.disks.wr_mb + "</td>";
                    var disk_tb_per_day = "<td>" + data.disks.wr_tb_per_day + "</td>";
                    var nw_adapter = "<td>" + data.network.count + "</td>";
                    var nw_traffic_percent = "<td>" + data.network.traffic_percent + "</td>";
                    var nw_traffic_rmb = "<td>" + data.network.tot_rb_in_mb + "</td>";
                    var nw_traffic_tmb = "<td>" + data.network.tot_tb_in_mb + "</td>";
                    var nw_traffic_mb = "<td>" + (data.network.tot_rb_in_mb+data.network.tot_tb_in_mb) + "</td>";
                    $("tbody").prepend("<tr>" + time + uptime + cpu_load + disks + disks_online + disk_load + disk_wr_mb + disk_tb_per_day + nw_adapter + nw_traffic_percent + nw_traffic_rmb + nw_traffic_tmb + nw_traffic_mb + "</tr>");
                });
            })
        </script>
        <style>
            body{font-family:'Courier New';font-size:12px}table{border-collapse:collapse;}table,td,th{border:1px solid black;padding:5px;}
            th{background-color:#666;color:#fff}tr:nth-child(odd){background-color:#fff5dd;}
        </style>
    </head>
    <body>
        <table>
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Uptime</th>
                    <th>CPU-load in %</th>
                    <th>Disk Count</th>
                    <th>Disk Online</th>
                    <th>Disk-load in %</th>
                    <th>wr MB</th>
                    <th>Expected wr TB per day</th>
                    <th>Transceiver Count</th>
                    <th>Traffic in %</th>
                    <th>Data received in MB</th>
                    <th>Data transmitted in MB</th>
                    <th>Data r+t in MB</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </body>
</html>
"""
