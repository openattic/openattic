# -*- coding: utf-8 -*-
# kate: hl python; space-indent on; indent-width 4; replace-tabs on;

import os
import sys

import time
import json

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
                    $("#log").html($("#log").html() + "<p>CPU Avgload: " + data.CPU.loadavg + "</p>");
                };
            })
        </script>
    </head>
    <body>
        <div id="log" style="font-family: courier; font-size: 0.75em;"></div>
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
        # "Using server-sent events"
        # https://developer.mozilla.org/en-US/docs/Server-sent_events/Using_server-sent_events
        # "Stream updates with server-sent events"
        # http://www.html5rocks.com/en/tutorials/eventsource/basics/

        headers = [('Content-type', 'text/event-stream; encoding=utf8'), ('Cache-Control', 'no-cache')]
        start_response(status, headers)

        # Set client-side auto-reconnect timeout, ms.
        yield 'retry: 100\n\n'

        # Dict filled with systemstats
        system_stats = { "CPU": {}, "temperature": {}, "disks": {}}

        # Dict filled with sysstats from the last and the actual call
        data = {}

        # Keep connection alive no more then... (s)
        request_GET_params = parse_qs(environ.get("QUERY_STRING", ""))
        itv = int(request_GET_params.get("interval", ["1"])[0])
        startup = True
        last = 0
        now  = time.time()
        end = now + 600
        while now < end:
            if now >= last + itv:
                if startup:
                    # Collect data from first call
                    startup = False
                    data["CPU_stats_old"] = getCpuTime()
                    time.sleep(1)
                # CPU stats
                data["CPU_stats_now"] = getCpuTime() #get actual stats
                total = data["CPU_stats_now"]["cpu"]["total"] - data["CPU_stats_old"]["cpu"]["total"]
                idle = data["CPU_stats_now"]["cpu"]["idle"] - data["CPU_stats_old"]["cpu"]["idle"]
                system_stats["CPU"]["loadavg"] = (total - idle) / total * 100
                data["CPU_stats_old"] = data["CPU_stats_now"] #update old stats

                # Temperature

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
    cpu_infos = {} #collect here the information
    with open("/proc/stat",'r') as cpu_stat:
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




