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
import datetime

from django.db import models
from django.db.models import Model

logger = logging.getLogger(__name__)

class TaskQueue(Model):
    task = models.CharField(max_length=1024)
    result = models.CharField(max_length=1024, editable=False)
    created = models.DateTimeField(auto_now=True)
    finished = models.DateTimeField(blank=True, null=True, editable=False)

    def run_once(self):
        assert self.finished is None
        try:
            task_val = json.loads(self.task)
        except ValueError as e:
            logger.exception('Failed to decode JSON "{}" created "{}"'.format(self.task, self.created))
            self.finish_task('Failed to execute task')
            return
        try:
            task = deserialize_task_chain(task_val)
        except ValueError as e:
            logger.exception('Failed to deserialize "{}" created "{}"'.format(self.task, self.created))
            self.finish_task('Failed to execute task')
            return
        logger.info(u'Running {}: {}'.format(self.pk, task))
        try:
            res = task.run_once()
        except Exception as e:
            logger.exception('Failed to run "{}" created "{}"'.format(task, self.created))
            self.finish_task('Failed to execute task')
            return
        if isinstance(res, Task):
            self.task = json.dumps(res.serialize())
            self.save_or_delete()
        else:
            self.finish_task(res)


    def finish_task(self, result):
        assert TaskQueue.objects.get(pk=self.pk).finished is None
        logger.info(u'Task finished: {}'.format(result))
        self.result = json.dumps(result)
        self.finished = datetime.datetime.now()
        self.save_or_delete()

    def save_or_delete(self):
        try:
            self.save()
        except Exception:
            logger.exception('Failed to save "{}"'.format(task))
            self.delete()


    def __unicode__(self):
        return str(self.pk)


class Task(object):
    def __init__(self, func, args, kwargs):
        """
        :type func: str | unicode
        :type args: list
        :type kwargs: dict[str, Any]
        """
        self.func = func
        self.args = args
        self.kwargs = kwargs

    @staticmethod
    def deserialize(value):
        if not isinstance(value, list) or len(value) != 3:
            return None
        func, args, kwargs = value
        if isinstance(func, basestring) and isinstance(args, list) and isinstance(kwargs, dict):
            return Task(func, args, kwargs)
        return None

    def serialize(self):
        return [self.func, self.args, self.kwargs]

    def run_once(self):
        module_name, func_name = self.func.rsplit('.', 1)
        print module_name, func_name
        m = __import__(module_name, fromlist=[func_name], level=0)
        func = getattr(m, func_name)
        res = func.call_now(*self.args, **self.kwargs)
        return res

    def __unicode__(self):
        return u'{} with {}, {}'.format(self.func, self.args, self.kwargs)

    def __str__(self):
        return '{} with {}, {}'.format(self.func, self.args, self.kwargs)

def deserialize_task_chain(value):
    """
    :rtype: Task
    :raises ValueError: Error occurred.
    """
    obj = Task.deserialize(value)
    if obj is None:
        raise ValueError('Unable to deserialize {}'.format(value))
    return obj

class TaskWrapper(object):
    def __init__(self, func):
        """This instance is kind of static. Don't store anything volatile."""
        self._orig_func = func

    def __call__(self, *args, **kwargs):
        return self.mk_task(args, kwargs)

    def mk_task(self, args, kwargs):
        """:rtype: Task"""
        func = self._orig_func.__module__ + '.' + self._orig_func.__name__
        return Task(func, list(args), kwargs)

    def delay(self, *args, **kwargs):
        """:rtype: TaskQueue"""
        obj = TaskQueue()
        obj.task = json.dumps(self.mk_task(args, kwargs).serialize())
        obj.save()
        return obj

    def call_now(self, *args, **kwargs):
        """:type task: TaskQueue"""
        return self._orig_func(*args, **kwargs)


def task(func):
    return TaskWrapper(func)


@task
def add(x,y):
    return x + y


@task
def wait(times):
    print times
    if times > 0:
        return wait(times - 1)
    else:
        return True

@task
def wait_add(times, x, y):
    return chain([wait(times), add(x, y)])


def chain(tasks):
    return chain_tasks([t.serialize() for t in tasks])

@task
def chain_tasks(values):
    assert len(values) >= 1

    def to_task(value):
        return value if isinstance(value, Task) else deserialize_task_chain(value)

    tasks = [to_task(v) for v in values]

    first, rest = tasks[0], tasks[1:]
    res = first.run_once()
    if isinstance(res, Task):
        return chain([res] + rest)
    elif not rest:
        return res
    else:
        # Ignoring res here.
        return chain(rest)
