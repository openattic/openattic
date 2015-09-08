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

import json, logging, traceback

from rest_framework import serializers, viewsets, status
from rest_framework.response import Response
from rest_framework import status

from drbd.models import Connection, Endpoint
from ifconfig.models import Host

from rest.multinode.handlers import RequestHandlers

class DrbdConnectionSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for DRBD connection """

    volume = serializers.HyperlinkedIdentityField(view_name="volume-detail")
    url = serializers.HyperlinkedIdentityField(view_name="mirror-detail")

    class Meta:
        model = Connection
        fields = ("id", "url", "protocol", "syncer_rate", "volume")


class DrbdConnectionViewSet(viewsets.ModelViewSet):
    """ Viewset for DRBD connection """

    queryset = Connection.objects.all()
    serializer_class = DrbdConnectionSerializer

    def create(self, request, *args, **kwargs):
        source_volume = request.DATA['source_volume']
        remote_pool = request.DATA['remote_pool']

        if "connection_id" not in request.DATA:
            print "CREATE CONNECTION AND FIRST CONNECTION ENDPOINT"
            # CREATE CONNECTION
            connection = Connection.objects.create_connection("C", "500K", source_volume["id"])
            print connection.id
        else:
            # CREATE VOLUME
            print "CREATE SECOND VOLUME AND ENDPOINT"
            connection_id = request.DATA["connection_id"]
            connection = Connection.objects.install_connection(connection_id, source_volume["id"], remote_pool["id"])

        ser = DrbdConnectionSerializer(connection, context={"request": request})
        return Response(ser.data, status=status.HTTP_201_CREATED)

    def _install_connection(self, request, connection_id):
        # called on the primary only, not part of the REST API
        source_volume = request.DATA['source_volume']
        Connection.objects.install_connection(connection_id, source_volume["id"])


class DrbdConnectionProxyViewSet(DrbdConnectionViewSet, RequestHandlers):
    """ Proxy viewset for DRBD connection """

    queryset = Connection.objects.all()
    api_prefix = "mirrors"
    host_filter = "host"
    model = Connection

    def create(self, request, *args, **kwargs):
        try:
            # Get all needed information from request
            source_volume = request.DATA["source_volume"]
            remote_pool = request.DATA["remote_pool"]

            try:
                source_volume_host = Host.objects.get(id=source_volume["host"]["id"])
                remote_pool_host = Host.objects.get(id=remote_pool["host"]["id"])
            except Host.DoesNotExist:
                return Response("Can't find the related host object of the volume that should be mirrored",
                                status=status.HTTP_404_NOT_FOUND)

            # First find out whether we're supposed to be primary or secondary.
            if "connection_id" not in request.DATA:
                # -> PRIMARY
                # Check where the source volume is located
                if source_volume_host == Host.objects.get_current():
                    # source volume is a local volume
                    # Step 1: Create the connection
                    connection_resp = super(DrbdConnectionProxyViewSet, self).create(request, args, kwargs)
                    connection_data = connection_resp.data

                    # Step 2: Call the secondary to create theirs
                    request = self._clone_request_with_new_data(request,
                                                                dict(request.DATA, connection_id=connection_data["id"]))
                    self._remote_request(request, remote_pool_host)

                    # Step 3: Install our local endpoint
                    self._install_connection(request, connection_data["id"])

                    return connection_resp
                else:
                    # -> source volume is a remote volume, call remote host
                    return Response(json.loads(self._remote_request(request, source_volume_host)),
                                    status=status.HTTP_201_CREATED)

            else:
                # -> SECONDARY
                # Secondary is always the correct host because the primary
                # forwards the request to the secondary ONLY.
                return super(DrbdConnectionProxyViewSet, self).create(request, args, kwargs)

        except Exception, err:
            logging.error(err)
            logging.error("Received exception: " + traceback.format_exc())


RESTAPI_VIEWSETS = [
    ("mirrors", DrbdConnectionProxyViewSet, "mirror")
]
