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

from http.models import Export
from peering.models import PeerHost
from ifconfig.models import Host

def browse(request, id):
    volume = Export.all_objects.get(id=id).volume
    host   = volume.vg.host
    if host is None:
        raise Http404("Export does not appear to be active on any host")
    if host == Host.objects.get_current():
        hostname = host.name
    else:
        peer = PeerHost.objects.get(name=host.name)
        hostname = peer.base_url.hostname
    target = "http://%(hostname)s/volumes/%(vgname)s/%(volname)s" % {
        'vgname':   volume.vg.name,
        'volname':  volume.name,
        'hostname': hostname
        }
    if request.META["QUERY_STRING"]:
        target += '?' + request.META["QUERY_STRING"]
    return HttpResponseRedirect(target)
