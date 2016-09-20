# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

from rest import relations

from requests.exceptions import HTTPError

from rest_framework import serializers, viewsets
from rest_framework.response import Response
from rest_framework import status

from drbd.models import Connection
from exception import validate_input_fields
from ifconfig.models import Host
from utilities import get_request_data
from volumes.models import StorageObject

from rest.multinode.handlers import RequestHandlers


class DrbdConnectionSerializer(serializers.HyperlinkedModelSerializer):
    """ Serializer for DRBD connection """

    volume = relations.HyperlinkedRelatedField(view_name="volume-detail", source="storageobj",
                                               queryset=StorageObject.objects.all())
    url = serializers.HyperlinkedIdentityField(view_name="mirror-detail")
    status = serializers.SerializerMethodField("get_status")

    class Meta:
        model = Connection
        fields = ("id", "url", "protocol", "syncer_rate", "volume", "status")

    def get_status(self, obj):
        return obj.get_status()


class DrbdConnectionViewSet(viewsets.ModelViewSet):
    """ Viewset for DRBD connection """

    queryset = Connection.objects.all()
    serializer_class = DrbdConnectionSerializer

    def create(self, request, *args, **kwargs):
        source_volume = get_request_data(request.DATA)['source_volume']
        remote_pool = get_request_data(request.DATA)['remote_pool']

        if "connection_id" not in get_request_data(request.DATA):
            # CREATE CONNECTION
            protocol_default = Connection._meta.get_field("protocol").get_default()
            syncer_rate_default = Connection._meta.get_field("syncer_rate").get_default()

            protocol = get_request_data(request.DATA).get("protocol", protocol_default)
            syncer_rate = get_request_data(request.DATA).get("syncer_rate", syncer_rate_default)

            connection = Connection.objects.create_connection(protocol, syncer_rate,
                                                              source_volume["id"])
        else:
            # CREATE VOLUME
            connection_id = get_request_data(request.DATA)["connection_id"]
            connection = Connection.objects.install_connection(connection_id, source_volume["id"],
                                                               remote_pool["id"])

        ser = DrbdConnectionSerializer(connection, context={"request": request})
        return Response(ser.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        if "new_size" in get_request_data(request.DATA):
            connection = self.get_object()

            # resize the local endpoint
            connection.resize_local_storage_device(get_request_data(request.DATA)["new_size"])
            ser = DrbdConnectionSerializer(connection, context={"request": request})
            return Response(ser.data, status=status.HTTP_200_OK)

        return super(DrbdConnectionViewSet, self).update(request, args, kwargs)

    def destroy(self, request, *args, **kwargs):
        connection = self.get_object()
        connection.uninstall_local_storage_device()

        if len(connection.get_storage_devices()) == 0:
            connection.storageobj.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        return Response(status=status.HTTP_204_NO_CONTENT)

    def _install_connection(self, request, connection_id):
        # called on the primary only, not part of the REST API
        source_volume = get_request_data(request.DATA)['source_volume']
        Connection.objects.install_connection(connection_id, source_volume["id"])

    def _create_filesystem(self, request, connection_id, filesystem):
        # called in the primary only, not part of the REST API
        options = {"owner": request.user,
                   "fswarning": 75,
                   "fscritical": 85}
        connection = Connection.objects.get(id=connection_id)
        connection.volume.create_filesystem(filesystem, options)


class DrbdConnectionProxyViewSet(DrbdConnectionViewSet, RequestHandlers):
    """ Proxy viewset for DRBD connection """

    queryset = Connection.objects.all()
    api_prefix = "mirrors"
    host_filter = "host"
    model = Connection

    def create(self, request, *args, **kwargs):
        # Get all needed information from request

        validate_input_fields(get_request_data(request.DATA), ["source_volume", "remote_pool"])
        source_volume = get_request_data(request.DATA)["source_volume"]
        remote_pool = get_request_data(request.DATA)["remote_pool"]

        source_volume_host = Host.objects.get(id=source_volume["host"]["id"])
        remote_pool_host = Host.objects.get(id=remote_pool["host"]["id"])

        # First find out whether we're supposed to be primary or secondary.
        if "connection_id" not in get_request_data(request.DATA):
            # -> PRIMARY
            # Check where the source volume is located
            if source_volume_host == Host.objects.get_current():
                # source volume is a local volume
                # Step 1: Create the connection
                connection_resp = super(DrbdConnectionProxyViewSet, self).create(request, args,
                                                                                 kwargs)

                if connection_resp.exception:
                    return connection_resp
                connection_data = connection_resp.data

                # Step 2: Call the secondary to create theirs
                request = self._clone_request_with_new_data(
                    request, dict(get_request_data(request.DATA), connection_id=connection_data["id"]))
                self._remote_request(request, remote_pool_host)

                # Step 3: Install our local endpoint
                self._install_connection(request, connection_data["id"])

                # Step 4: Make filesystem if one is given
                filesystem = get_request_data(request.DATA).get("filesystem", None)
                if filesystem:
                    self._create_filesystem(request, connection_data["id"], filesystem)

                return connection_resp
            else:
                # -> source volume is a remote volume, call remote host
                return self._remote_request(request, source_volume_host)
        else:
            # -> SECONDARY
            # Secondary is always the correct host because the primary
            # forwards the request to the secondary ONLY.
            return super(DrbdConnectionProxyViewSet, self).create(request, args, kwargs)

    def update(self, request, *args, **kwargs):
        if "new_size" in get_request_data(request.DATA):
            connection = self.get_object()
            host = connection.host

            if host == Host.objects.get_current():
                # Step 1: Call second host to grow his endpoint, if the request was not forwarded by
                # sencondary host
                if "proxy_host_id" not in get_request_data(request.DATA):
                    try:
                        self._remote_request(request, connection.peerhost, obj=connection)
                    except HTTPError, e:
                        return Response(e.response.json(), status=e.response.status_code)

                # Step 2: Resize local endpoint and connection
                return super(DrbdConnectionProxyViewSet, self).update(request, args, kwargs)
            else:
                # Step 1: Resize local endpoint
                try:
                    res = super(DrbdConnectionProxyViewSet, self).update(request, args, kwargs)
                except HTTPError, e:
                    return Response(e.response.json(), status=e.response.status_code)

                # Step 2: Call primary host to grow his endpoint and connection, if this was called
                # by a client and not by the primary host.
                if "proxy_host_id" not in get_request_data(request.DATA):
                    try:
                        res = self._remote_request(request, host, obj=connection)
                    except HTTPError, e:
                        return Response(e.response.json(), status=e.response.status_code)
                return res
        return super(DrbdConnectionProxyViewSet, self).update(request, args, kwargs)

    def destroy(self, request, *args, **kwargs):
        connection = self.get_object()
        host = connection.host

        if host == Host.objects.get_current():
            # Step 1: Call second host to delete his endpoint, if the request was not forwarded by
            # secondary host
            if len(connection.get_storage_devices()) > 1:
                self._remote_request(request, connection.peerhost, obj=connection)

            # Step 2: Delete local endpoint and connection
            return super(DrbdConnectionProxyViewSet, self).destroy(request, args, kwargs)
        else:
            # Step 1: Remove local endpoint
            # Store the connection host. After deleting the local endpoint the host property would
            # return None because the current host gets a 'no resources defined!' by executing
            # 'drbdadm role <connection_name>'
            connection_host = host
            super(DrbdConnectionProxyViewSet, self).destroy(request, args, kwargs)

            # Step 2: Call Primary host, if this host was called by a client and not by the primary
            # host
            if "proxy_host_id" not in get_request_data(request.DATA):
                self._remote_request(request, connection_host, obj=connection)

            return Response(status=status.HTTP_204_NO_CONTENT)


RESTAPI_VIEWSETS = [
    ("mirrors", DrbdConnectionProxyViewSet, "mirror")
]
