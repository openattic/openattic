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
from rest_framework.reverse import reverse

from taskqueue.models import TaskQueue


class TaskQueueSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source='status_name')
    class Meta(object):
        model = TaskQueue


class TaskQueueViewSet(viewsets.ModelViewSet):
    serializer_class = TaskQueueSerializer
    queryset = TaskQueue.objects.all()



class TaskQueueLocationMixin(object):

    def post_save(self, obj, created=False):
        task_queue = getattr(obj, '_task_queue', None)
        if isinstance(task_queue, TaskQueue):
            self.headers['Taskqueue-Location'] = reverse('taskqueue-detail',
                                                         kwargs={'pk': task_queue.pk},
                                                         request=self.request)


RESTAPI_VIEWSETS = [
    ('taskqueue',     TaskQueueViewSet,     'taskqueue'),
]
