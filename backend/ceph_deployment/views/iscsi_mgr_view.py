# -*- coding: utf-8 -*-
"""
 *   Copyright (c) 2017 SUSE LLC
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

from rest_framework.decorators import api_view
from rest_framework.response import Response
from ceph_deployment.deepsea import DeepSea


@api_view(['GET'])
def iscsi_status(request):
    return Response({'status': DeepSea.instance().iscsi_status()})


@api_view(['POST'])
def iscsi_deploy(request):
    return Response({'result': DeepSea.instance().iscsi_deploy()})


@api_view(['POST'])
def iscsi_undeploy(request):
    return Response({'result': DeepSea.instance().iscsi_undeploy()})
