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

# now we can use the openattic backend, for example
# from ifconfig.models import Host
# current_host = Host.objects.get_current()

sse_data = """
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8" />
        <script src="http://cdnjs.cloudflare.com/ajax/libs/jquery/1.8.3/jquery.min.js "></script>
        <script>
            $(document).ready(function() {
                var es = new EventSource("stream" + location.search);
                es.onmessage = function (e) {
                    var data = JSON.parse(e.data);
                    console.log(e.data);
                    var date = new Date(data.timestamp*1000);
                    var dmy = date.getDate() + '.' + (date.getMonth()+1) + '.' + date.getFullYear();
                    var seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
                    var minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
                    var hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
                    var hms = hours + ':' + minutes + ':' + seconds;
                    var time = "<td>" + dmy + ' ' + hms + "</td>";
                    var uptime_d = Math.floor(data.sys.uptime / 86400);
                    var uptime_h = Math.floor((data.sys.uptime % 86400) / 3600);
                    var uptime_m = Math.floor(((data.sys.uptime % 86400) % 3600) / 60);
                    var uptime = "<td>" + uptime_d + 'D ' + uptime_h + 'H ' + uptime_m + 'M' + "</td>";
                    var cpu_load = "<td>" + data.cpu.load_percent + "</td>";
                    var disks = "<td>" + data.disks.count + "</td>";
                    var disk_load = "<td>" + data.disks.load_percent + "</td>";
                    var disk_tb_per_day = "<td>" + data.disks.wr_tb_per_day + "</td>";
                    var nw_adapter = "<td>" + data.network.count + "</td>";
                    var nw_traffic_mb = "<td>" + (data.network.traffic_r_mb+data.network.traffic_t_mb) + "</td>";
                    $("tbody").prepend("<tr>" + time + uptime + cpu_load + disks + disk_load + disk_tb_per_day + nw_adapter + nw_traffic_mb + "</tr>");
                };
            })
        </script>
        <style>table{border-collapse:collapse;}table,td,th{border:1px solid black;padding:5px;}</style>
    </head>
    <body>
        <table>
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Uptime</th>
                    <th>CPU-load in %</th>
                    <th>Disk</th>
                    <th>Disk-load in %</th>
                    <th>Expected wr TB per day</th>
                    <th>Network Adapter</th>
                    <th>Network Traffic in MB</th>
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
        system_stats = { "cpu": {}, "disks": {}, "network": {}, "temperature": {}, "sys": {}, "timestamp": 0}

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

                for key in data["disk_stats_now"]:
                    tot_ticks = tot_ticks + (data["disk_stats_now"][key]["tot_ticks"] - data["disk_stats_old"][key]["tot_ticks"])
                    tot_wr_bps = tot_wr_bps + ((data["disk_stats_now"][key]["wr_sectors"] - data["disk_stats_old"][key]["wr_sectors"]) / (now - last) * bytes_per_sector)

                system_stats["disks"].update({"count": len(data["disk_stats_now"])})
                system_stats["disks"].update({"load_percent": (tot_ticks / ((now - last) * 1000.) * 100.) / system_stats["disks"]["count"]})
                system_stats["disks"].update({"wr_tb_per_day": (tot_wr_bps / float(1024**4)) * 86400})

                # network
                data["network_stats_now"] = getNetworkStats()
                tot_bytes_received = 0
                tot_bytes_transmitted = 0

                for key in data["network_stats_now"]:
                    tot_bytes_received = tot_bytes_received + (data["network_stats_now"][key]["receive"]["bytes"] - 
                                                               data["network_stats_old"][key]["receive"]["bytes"])
                    tot_bytes_transmitted = tot_bytes_transmitted + (data["network_stats_now"][key]["transmit"]["bytes"] - 
                                                                     data["network_stats_old"][key]["transmit"]["bytes"])

                system_stats["network"].update({"count": len(data["network_stats_now"])})
                system_stats["network"].update({"traffic_r_mb": tot_bytes_received / (1024**2)})
                system_stats["network"].update({"traffic_t_mb": tot_bytes_transmitted / (1024**2)})

                # sys
                uptime = getUptime()
                system_stats["sys"].update({"uptime": uptime['uptime']})

                # temperature
			

                # Update old stats
                data["cpu_stats_old"] = data["cpu_stats_now"]
                data["disk_stats_old"] = data["disk_stats_now"]
                data["network_stats_old"] = data["network_stats_now"]

                last = now
                yield 'data: %s\n\n' % (json.dumps(system_stats))
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

def getNetworkStats():
    '''
    load from /proc/net/dev
          rbytes  rpackets  rerrs  rdrop  rfifo  rframe  rcompressed rmulticast  tbytes  tpackets  terrs  tdrop  tfifo  tcolls  tcarrier  tcompressed
    etc0  0       0         0      0      0      0       0           0           0       0         0      0      0      0       0         0
    '''
    network_infos = {}
    with open("/proc/net/dev", "r") as net_stat:
        lines = [line.split() for line in net_stat.readlines()[2:]]#skip row 1,2 and loop

        #compute for every adapter
        for adapter in lines:
            if adapter[0].startswith("lo"):
                continue
            adapter = [adapter[0]]+[float(i) for i in adapter[1:]]
            adapter_id,rbyte,rpack,rerrs,rdrop,rfifo,rframe,rcomp,rmult,tbyte,tpack,terrs,tdrop,tfifo,tcolls,tcarr,tcomp = adapter

            network_infos.update({adapter_id[:-1]:{
                                  "receive":{"bytes":rbyte,"packets":rpack,"errs":rerrs,"drop":rdrop,
                                           "fifo":rfifo,"frame":rframe,"compressed":rcomp,"multicast":rmult},
                                  "transmit":{"bytes":tbyte,"packets":tpack,"errs":terrs,"drop":tdrop,
                                            "fifo":tfifo,"colls":tcolls,"carrier":tcarr,"compressed":tcomp}}
                                })
    return network_infos

def getDiskStats():
    ctx = pyudev.Context()
    disk_stats = {}

    for dev in ctx.list_devices():
        if ("MAJOR" not in dev or int(dev["MAJOR"].strip("\0")) != 8) and "virtio" not in dev.device_path:
            continue
        if "MINOR" not in dev or int(dev["MINOR"].strip("\0")) % 16 != 0:
            continue

        device_path = str(dev.device_path.split("/")[-1])
        with open("/sys/class/block/%s/stat" % (device_path), "r") as disk_stat:
            data = disk_stat.read().split()
            data = [float(i) for i in data]#type casting
            rd_ios,rd_merges,rd_sectors,rd_ticks,wr_ios,wr_merges,wr_sectors,wr_ticks,ios_in_prog,tot_ticks,rq_ticks = data
            disk_stats.update({device_path: {"rd_ios": rd_ios, "rd_merges": rd_merges, "rd_sectors": rd_sectors, "rd_ticks": rd_ticks,
                                             "wr_ios": wr_ios, "wr_merges": wr_merges, "wr_sectors": wr_sectors, "wr_ticks": wr_ticks,
                                             "ios_in_prog": ios_in_prog, "tot_ticks": tot_ticks, "rq_ticks": rq_ticks}})

    return disk_stats

def getUptime():
    uptime = {}

    with open("/proc/uptime", "r") as up_stat:
        data = up_stat.read().split()
        data = [float(i) for i in data]
        up,idle = data
        uptime.update({"uptime": up, "idle": idle})

    return uptime

