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

from django.db import models
from django.db.models import Model
from django.db.models.query_utils import Q
from django.utils.functional import cached_property

logger = logging.getLogger(__name__)


class TaskQueue(Model):
    STATUS_NOT_STARTED = 1
    STATUS_RUNNING = 2
    STATUS_FINISHED = 3
    STATUS_EXCEPTION = 4

    STATUS_CHOICES = (
        (STATUS_NOT_STARTED, 'Not Started'),
        (STATUS_RUNNING, 'Running'),
        (STATUS_FINISHED, 'Finished'),
        (STATUS_EXCEPTION, 'Exception')
    )

    task = models.CharField(max_length=1024)
    result = models.CharField(max_length=1024, editable=False)
    created = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True, null=True, blank=True)
    status = models.IntegerField(choices=STATUS_CHOICES, default=STATUS_NOT_STARTED, editable=False)
    percent = models.IntegerField(default=0)

    def run_once(self):
        """
        You can think of run_once as a trampoline that stores is intermediate result into the db.
        """
        if self.status == TaskQueue.STATUS_NOT_STARTED:
            self.transition(TaskQueue.STATUS_RUNNING)
        try:
            task_val = json.loads(self.task)
        except ValueError as e:
            logger.exception(
                'Failed to decode JSON "{}" created "{}"'.format(self.task, self.created))
            self.finish_with_exception(e)
            return
        try:
            task = deserialize_task(task_val)
        except ValueError as e:
            logger.exception(
                'Failed to deserialize "{}" created "{}"'.format(self.task, self.created))
            self.finish_with_exception(e)
            return
        logger.info(u'Running {}: {}'.format(self.pk, task))
        try:
            res = task.run_once()
        except Exception as e:
            logger.exception('Failed to run "{}" created "{}"'.format(task, self.created))
            self.finish_with_exception(e)
            return
        if isinstance(res, Task):
            self.task = json.dumps(res.serialize())
            self.percent = task.percent()
            self.save_or_delete()
        else:
            self.finish_task(res)

    @property
    def status_name(self):
        return TaskQueue.STATUS_CHOICES[self.status - 1][1]

    def finish_with_exception(self, e):
        """:type e: Exception"""
        self.finish_task(e.message, TaskQueue.STATUS_EXCEPTION)

    def finish_task(self, result, status=STATUS_FINISHED):
        assert TaskQueue.objects.get(pk=self.pk).status not in [TaskQueue.STATUS_FINISHED,
                                                                TaskQueue.STATUS_EXCEPTION]
        logger.info(u'Task finished: {}'.format(result))
        self.result = json.dumps(result)
        self.percent = 100
        self.transition(status)

    def transition(self, new_status):
        logger.info(u'Task Transition: {} -> {}'.format(self.status_name,
                                                        TaskQueue.STATUS_CHOICES[new_status - 1][
                                                            1]))
        self.status = new_status
        self.save_or_delete()

    def save_or_delete(self):
        try:
            self.save()
        except Exception:
            logger.exception('Failed to save "{}"'.format(task))
            self.delete()

    @staticmethod
    def cleanup():
        TaskQueue.objects.filter(
            TaskQueue.in_status_q([TaskQueue.STATUS_FINISHED, TaskQueue.STATUS_EXCEPTION])).delete()

    @staticmethod
    def in_status_q(states):
        return reduce(lambda l, status: l | Q(status=status), states[1:], Q(status=states[0]))

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
        def deep_serialize(arg):
            if isinstance(arg, Task):
                return arg.serialize()
            if isinstance(arg, list):
                return [deep_serialize(elem) for elem in arg]
            if isinstance(arg, dict):
                return {key: deep_serialize(val) for key, val in arg.iteritems()}
            return arg

        args = [deep_serialize(arg) for arg in self.args]
        kwargs = {key: deep_serialize(val) for key, val in self.kwargs.iteritems()}
        return [self.func, args, kwargs]

    @cached_property
    def wrapper(self):
        """:rtype: TaskWrapper"""
        module_name, func_name = self.func.rsplit('.', 1)
        m = __import__(module_name, fromlist=[func_name], level=0)
        return getattr(m, func_name)

    def run_once(self):
        """:returns: Either a new Task or a final result."""
        res = self.wrapper.call_now(*self.args, **self.kwargs)
        return res

    def percent(self):
        return self.wrapper.percent(*self.args, **self.kwargs)

    def __unicode__(self):
        return u'{} with {}, {}'.format(self.func, self.args, self.kwargs)

    def __str__(self):
        return '{} with {}, {}'.format(self.func, self.args, self.kwargs)


def deserialize_task(value):
    """
    :rtype: Task
    :raises ValueError: Error occurred.
    """
    if isinstance(value, Task):
        return value
    obj = Task.deserialize(value)
    if obj is None:
        raise ValueError('Unable to deserialize {}'.format(value))
    return obj


class TaskWrapper(object):
    def __init__(self, func, percent=None):
        """This instance is kind of static. Don't store anything volatile."""
        self._orig_func = func
        self._percent = percent

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
        return self._orig_func(*args, **kwargs)

    def percent(self, *args, **kwargs):
        value = self._percent(*args, **kwargs) if self._percent else 0
        if value < 0 or value > 100:
            logger.warning('percent={} is value wrong. {}'.format(value, self._orig_func))
        return max(min(value, 100), 0)


def task(*args, **kwargs):
    def inner(func):
        return TaskWrapper(func, *args, **kwargs)
    if kwargs:
        return inner
    else:
        return TaskWrapper(args[0])


def chain_percent(values, total_count=None):
    assert len(values) >= 1
    total_count = total_count if total_count else len(values)

    current_tasks_percent = float(total_count - len(values)) / float(total_count)

    first = deserialize_task(values[0])
    first_percent = first.percent() / float(100)

    return (current_tasks_percent + first_percent / float(total_count)) * 100


@task(percent=chain_percent)
def chain(values, total_count=None):
    assert len(values) >= 1
    total_count = total_count if total_count is not None else len(values)

    tasks = [deserialize_task(v) for v in values]

    first, rest = tasks[0], tasks[1:]
    res = first.run_once()
    if isinstance(res, Task):
        return chain([res] + rest, total_count)
    elif not rest:
        return res
    else:
        # Ignoring res here.
        return chain(rest, total_count)
