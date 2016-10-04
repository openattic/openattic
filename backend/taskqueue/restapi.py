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
from django.conf import settings
from rest_framework import serializers, viewsets
from rest_framework import status
from rest_framework.decorators import list_route
from rest_framework.response import Response
from rest_framework.reverse import reverse

from taskqueue.models import TaskQueue
from nodb.restapi import JsonField
from utilities import get_request_data


class TaskQueueSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source='status_name')
    result = JsonField(source='json_result')

    class Meta(object):
        model = TaskQueue
        exclude = ('task',)


class TaskQueueViewSet(viewsets.ModelViewSet):
    """This API provides access to long running tasks."""

    serializer_class = TaskQueueSerializer
    queryset = TaskQueue.objects.all()

    def destroy(self, request, *args, **kwargs):
        # Inspired by rest_framework.mixins.UpdateModelMixin
        self.object = self.get_object()

        self.object.finish_task(None, TaskQueue.STATUS_ABORTED)

        serializer = self.get_serializer(self.object)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @list_route(['post'])
    def test_task(self, request, *args, **kwargs):
        if not settings.DEBUG:
            return Response(status=status.HTTP_404_NOT_FOUND)
        from taskqueue.tests import wait
        times = get_request_data(request).get('times', 100)
        task = wait.delay(times)
        serializer = self.get_serializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)




class TaskQueueLocationMixin(object):
    """
    This mixin adds a "Taskqueue-Location" HTTP-header pointing to the `_task_queue` attribute of
    saved model instances.
    """

    def post_save(self, obj, created=False):
        super(TaskQueueLocationMixin, self).post_save(obj, created)
        task_queue = getattr(obj, '_task_queue', None)
        if isinstance(task_queue, TaskQueue):
            self.headers['Taskqueue-Location'] = reverse('taskqueue-detail',
                                                         kwargs={'pk': task_queue.pk},
                                                         request=self.request)


RESTAPI_VIEWSETS = [
    ('taskqueue',     TaskQueueViewSet,     'taskqueue'),
]
