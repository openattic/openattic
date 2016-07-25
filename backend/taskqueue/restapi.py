# -*- coding: utf-8 -*-
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
from rest_framework import serializers, viewsets

from taskqueue.models import TaskQueue


class TaskQueueSerializer(serializers.ModelSerializer):

    class Meta(object):
        model = TaskQueue


class TaskQueueViewSet(viewsets.ModelViewSet):
    serializer_class = TaskQueueSerializer
    queryset = TaskQueue.objects.all()


RESTAPI_VIEWSETS = [
    ('taskqueue',     TaskQueueViewSet,     'taskqueue'),
]