# -*- coding: utf-8 -*-
# kate: hl python; space-indent on; indent-width 4; replace-tabs on;

import os
import sys

import time
import json
import pyudev

from cgi import parse_qs

# setup Django
from os.path import join, dirname, abspath, exists
PROJECT_ROOT = dirname(abspath(__file__))

# environment variables
sys.path.insert( 0, PROJECT_ROOT )
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'

# Setup Django
import django
try:
    django.setup()
except AttributeError:
    pass

# now we can use the openattic backend, for example
# from ifconfig.models import Host
# current_host = Host.objects.get_current()
from volumes.models import PhysicalBlockDevice
from volumes.models import VolumePool

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
                    var disks = "<td>" + data.disks.count_oa + "</td>";
                    var disks_online = "<td>" + data.disks.count_online + '/' + data.disks.count + "</td>";
                    var disk_load = "<td>" + data.disks.load_percent + "</td>";
                    var disk_tb_per_day = "<td>" + data.disks.wr_tb_per_day + "</td>";
                    var nw_adapter = "<td>" + data.network.count + "</td>";
                    var nw_traffic_percent = "<td>" + data.network.traffic_percent + "</td>";
                    var nw_traffic_rmb = "<td>" + data.network.tot_rb_in_mb + "</td>";
                    var nw_traffic_tmb = "<td>" + data.network.tot_tb_in_mb + "</td>";
                    $("tbody").prepend("<tr>" + time + uptime + cpu_load + disks + disks_online + disk_load + disk_tb_per_day + nw_adapter + nw_traffic_percent + nw_traffic_rmb + nw_traffic_tmb + "</tr>");
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
                    <th>Expected wr TB per day</th>
                    <th>Transceiver Count</th>
                    <th>Traffic in %</th>
                    <th>Data received in MB</th>
                    <th>Data transmitted in MB</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </body>
</html>
"""

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

        # Dict filled with systemstats
        system_stats = { "cpu": {}, "disks": {}, "network": {}, "temperature": {}, "sys": {}, "timestamp": 0, "debug": {}}

        # Dict filled with sysstats from the last and the actual call
        data = {}

        # Collect Serverstats and wait 1 seconds
        last = time.time()
        data["cpu_stats_old"] = getCpuTime()
        data["disk_stats_old"] = getDiskStats()
        data["network_stats_old"] = getNetworkStats()
        time.sleep(1)

        # Keep connection alive no more then... (s)
        request_GET_params = parse_qs(environ.get("QUERY_STRING", ""))
        itv = int(request_GET_params.get("interval", ["1"])[0])
        now  = time.time()
        start = now
        end = now + 600
        while now < end:
            if now >= last + itv:
                # Time
                system_stats["timestamp"] = now

                # CPU stats
                data["cpu_stats_now"] = getCpuTime()
                total = data["cpu_stats_now"]["cpu"]["total"] - data["cpu_stats_old"]["cpu"]["total"]
                idle = data["cpu_stats_now"]["cpu"]["idle"] - data["cpu_stats_old"]["cpu"]["idle"]
                system_stats["cpu"].update({"load_percent": (total - idle) / total * 100})

                # disk stats
                data["disk_stats_now"] = getDiskStats()
                bytes_per_sector = 512
                tot_ticks = 0
                tot_wr_bps = 0
                disks_size = 0

                for key in data["disk_stats_now"]:
                    tot_ticks = tot_ticks + (data["disk_stats_now"][key]["tot_ticks"] - data["disk_stats_old"][key]["tot_ticks"])
                    tot_wr_bps = tot_wr_bps + ((data["disk_stats_now"][key]["wr_sectors"] - data["disk_stats_old"][key]["wr_sectors"]) / (now - last) * bytes_per_sector)
                    disks_size = disks_size + (data["disk_stats_now"][key]["block_size"] * bytes_per_sector)

                system_disks = 0
                system_disks_online = 0
                for pbd in PhysicalBlockDevice.objects.all():
                    system_disks = system_disks + 1
                    if(pbd.device.get_status()[0] == "online"):
                        system_disks_online = system_disks_online + 1

                system_stats["disks"].update({"count": system_disks})
                system_stats["disks"].update({"count_online": system_disks_online})
                system_stats["disks"].update({"count_oa": len(data["disk_stats_now"])})
                system_stats["disks"].update({"load_percent": (tot_ticks / ((now - last) * 1000.) * 100.) / system_stats["disks"]["count"]})
                system_stats["disks"].update({"size_b": disks_size})
                system_stats["disks"].update({"size_gb": disks_size / float(1024**3)})
                system_stats["disks"].update({"size_tb": disks_size / float(1024**4)})
                system_stats["disks"].update({"wr_tb_per_day": (tot_wr_bps / float(1024**4)) * 86400})

                # network
                data["network_stats_now"] = getNetworkStats()
                tot_bytes_received = 0
                tot_bytes_transmitted = 0
                tot_speed = 0

                for key in data["network_stats_now"]:
                    tot_bytes_received = tot_bytes_received + (data["network_stats_now"][key]["received"]["bytes"] - 
                                                               data["network_stats_old"][key]["received"]["bytes"])
                    tot_bytes_transmitted = tot_bytes_transmitted + (data["network_stats_now"][key]["transmitted"]["bytes"] - 
                                                                     data["network_stats_old"][key]["transmitted"]["bytes"])
                    if data["network_stats_now"][key]["speed"] is not None:
                        tot_speed = tot_speed + data["network_stats_now"][key]["speed"]

                system_stats["network"].update({"count": len(data["network_stats_now"])})
                system_stats["network"].update({"tot_rb_in_mb": tot_bytes_received / (1024**2)})
                system_stats["network"].update({"tot_tb_in_mb": tot_bytes_transmitted / (1024**2)})
                tot_bytes = system_stats["network"]["tot_rb_in_mb"] + system_stats["network"]["tot_tb_in_mb"]
                if tot_speed > 0:
                    system_stats["network"].update({"traffic_percent": (tot_bytes/tot_speed*100)})
                else:
                    system_stats["network"].update({"traffic_percent": "NaN"})

                # sys
                uptime = getUptime()
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
                yield "data: %s\n\n" % (json.dumps(system_stats))#do not change this line
            time.sleep(1)
            now  = time.time()

def getCpuTime():
    '''
    load from /proc/stat

        user    nice   system  idle      iowait irq   softirq  steal  guest  guest_nice
    cpu  74608   2520   24433   1117073   6176   4054  0        0      0      0

    Idle=idle+iowait
    NonIdle=user+nice+system+irq+softirq+steal
    Total=Idle+NonIdle # first line of file for all cpus

    CPU_Percentage=((Total-PrevTotal)-(Idle-PrevIdle))/(Total-PrevTotal)*100
    '''
    cpu_infos = {}#collect here the information
    with open("/proc/stat","r") as cpu_stat:
        lines = [line.split(' ') for content in cpu_stat.readlines() for line in content.split('\n') if line.startswith('cpu')]

        #compute for every cpu
        for cpu_line in lines:
            if '' in cpu_line: cpu_line.remove('')#remove empty elements
            cpu_line = [cpu_line[0]]+[float(i) for i in cpu_line[1:]]#type casting
            cpu_id,user,nice,system,idle,iowait,irq,softrig,steal,guest,guest_nice = cpu_line

            Idle = idle+iowait
            NonIdle = user+nice+system+irq+softrig+steal
            Total = Idle+NonIdle

            #update dictionionary
            cpu_infos.update({cpu_id:{'total':Total,'idle':Idle}})
        return cpu_infos

def getDiskStats():
    ctx = pyudev.Context()
    disk_stats = {}

    for dev in ctx.list_devices():
        if ("MAJOR" not in dev or int(dev["MAJOR"].strip("\0")) != 8) and "virtio" not in dev.device_path:
            continue
        if "MINOR" not in dev or int(dev["MINOR"].strip("\0")) % 16 != 0:
            continue
        if int(dev.attributes["size"].strip("\0")) == 0:
            continue

        device_name = str(dev.device_path.split("/")[-1])
        with open("/sys/class/block/%s/stat" % (device_name), "r") as disk_stat:
            data = disk_stat.read().split()
            data = [float(i) for i in data]#type casting
            rd_ios,rd_merges,rd_sectors,rd_ticks,wr_ios,wr_merges,wr_sectors,wr_ticks,ios_in_prog,tot_ticks,rq_ticks = data
            disk_stats.update({device_name: {"rd_ios": rd_ios, "rd_merges": rd_merges, "rd_sectors": rd_sectors, "rd_ticks": rd_ticks,
                                             "wr_ios": wr_ios, "wr_merges": wr_merges, "wr_sectors": wr_sectors, "wr_ticks": wr_ticks,
                                             "ios_in_prog": ios_in_prog, "tot_ticks": tot_ticks, "rq_ticks": rq_ticks}})

        with open("/sys/class/block/%s/size" % (device_name), "r") as disk_size:
            disk_stats[device_name]["block_size"] = int(disk_size.read().split()[0])

    return disk_stats

def getNetworkStats():
    '''
    load from /sys/class/net/*eth0,eth1,lo/statistics
    '''
    network_infos = {}
    ctx = pyudev.Context()

    for dev in ctx.list_devices(subsystem='net'):
        if(dev.attributes["operstate"] == "up" and dev.sys_name != "lo"):
            try:
                speed = float(dev.attributes["speed"])#is not defined on VMs
            except KeyError:
                speed = None

            network_infos.update({dev.sys_name: {"status": dev.attributes["operstate"],"speed": speed}})

    for dev in network_infos:
        dev_path = "/sys/class/net/%s/statistics" % (dev)
        with open("%s/rx_bytes" % (dev_path), "r") as net_stat: rx_bytes = net_stat.readline().split()[0]
        with open("%s/rx_packets" % (dev_path), "r") as net_stat: rx_packets = net_stat.readline().split()[0]
        with open("%s/tx_bytes" % (dev_path), "r") as net_stat: tx_bytes = net_stat.readline().split()[0]
        with open("%s/tx_packets" % (dev_path), "r") as net_stat: tx_packets = net_stat.readline().split()[0]
        network_infos[dev].update({"received": {"bytes":float(rx_bytes),"packets":float(rx_packets)}})
        network_infos[dev].update({"transmitted": {"bytes":float(tx_bytes),"packets":float(tx_packets)}})

    return network_infos

def getUptime():
    uptime = {}

    with open("/proc/uptime", "r") as up_stat:
        data = up_stat.read().split()
        data = [float(i) for i in data]
        up,idle = data
        uptime.update({"uptime": up, "idle": idle})

    return uptime

