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

from django.http import HttpResponseRedirect, Http404

from nagios.models import Service
from peering.models import PeerHost

def graph(request, service_id, srcidx):
    serv = Service.all_objects.get(id=service_id)
    if serv.volume is not None:
        host = serv.volume.vg.host
    else:
        host = serv.host
    if host is None:
        raise Http404("Service does not appear to be active on any host")
    peer = PeerHost.objects.get(name=host.name)
    target = "http://%(hostname)s/openattic/nagios/%(id)d/%(srcidx)s.png" % {
        'id': int(service_id),
        'srcidx': int(srcidx),
        'hostname': peer.base_url.hostname
        }
    if request.META["QUERY_STRING"]:
        target += '?' + request.META["QUERY_STRING"]
    return HttpResponseRedirect(target)
