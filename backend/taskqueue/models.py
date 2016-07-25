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
import json
import logging
from functools import wraps
import datetime

from django.db import models
from django.db.models import Model

logger = logging.getLogger(__name__)

class TaskQueue(Model):
    func = models.CharField(max_length=256)
    args = models.CharField(max_length=1024)
    result = models.CharField(max_length=1024)
    created = models.DateTimeField(auto_now=True)
    finished = models.DateTimeField(blank=True, null=True)

    def on_map(self):
        module_name, func_name = self.func.rsplit('.', 1)
        print module_name, func_name
        m = __import__(module_name, fromlist=[func_name], level=0)
        func = getattr(m, func_name)
        try:
            args, kwargs = json.loads(self.args)
        except ValueError as e:
            logger.exception('Failed to decode JSON when running "{}" with "{}" created "{}"'.format(self.func, self.args, self.created))
            self.finish_task('Failed to execute task')
            return

        res = func._orig_func(self, *args, **kwargs)
        if isinstance(res, TaskQueue):
            assert res.pk == self.pk  # Don't span completely new tasks for now.
        else:
            self.finish_task(res)

    def finish_task(self, result):
        assert TaskQueue.objects.get(pk=self.pk).finished is None
        self.result = json.dumps(result)
        self.finished = datetime.datetime.now()
        self.save()

    def __unicode__(self):
        return str(self.pk)


class TaskWrapper(object):
    def __init__(self, func):
        """This instance is kind of static. Don't store anything volatile."""
        self._orig_func = func

    def __call__(self, *args, **kwargs):
        obj = None
        if args and isinstance(args[0], TaskQueue):
            obj = args[0]
            args = args[1:] # don't store task as argument in db.
        else:
            obj = TaskQueue()
        obj.func = self._orig_func.__module__ + '.' + self._orig_func.__name__
        obj.args = json.dumps((args, kwargs))
        obj.save()
        return obj


def task(func):
    return TaskWrapper(func)


@task
def add(task, x,y):
    return x + y

@task
def wait(task, times):
    print times
    if times > 0:
        return wait(task, times - 1)
    else:
        return add(task, 35, 7)