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
    """
    Each instance of this model is a Job that will be executed.
    """
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

    task = models.TextField(help_text="The JSON-serialized task to run.", blank=False)
    result = models.CharField(max_length=1024, editable=False, blank=True, null=True,
                              help_text="The return value of the task queue.")
    created = models.DateTimeField(auto_now_add=True)
    last_modified = models.DateTimeField(auto_now=True, null=True, blank=True)
    status = models.IntegerField(choices=STATUS_CHOICES, default=STATUS_NOT_STARTED, editable=False,
                                 help_text="A state-machine: not-started -> running -> finished | "
                                           "exception")
    percent = models.IntegerField(default=0)
    description = models.CharField(max_length=128, blank=False)

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

    @property
    def json_result(self):
        """:rtype: list | dict | None"""
        try:
            return json.loads(self.result)
        except ValueError as e:
            return None

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

    @staticmethod
    def filter_by_definition_and_status(task, task_status=None):
        task_definition = "[{}, {}, {}]".format(json.dumps(task.func_reference),
                                                json.dumps(task.args), json.dumps(task.kwargs))
        if task_status:
            status = TaskQueue.in_status_q(task_status)
            return TaskQueue.objects.filter(status, task=task_definition).order_by('last_modified')
        else:
            return TaskQueue.objects.filter(task=task_definition).order_by('last_modified')

    def __unicode__(self):
        return str(self.pk)


class Task(object):
    """
    A task is a JSON-serializable closure without any non-applied arguments.
    """
    def __init__(self, func_reference, args, kwargs):
        """
        :type func_reference: str | unicode
        :type args: list
        :type kwargs: dict[str, Any]
        """
        self.func_reference = func_reference
        self.args = args
        self.kwargs = kwargs

    @staticmethod
    def deserialize(value):
        """
        :type value: list | dict
        :rtype: Task | None
        """
        if not isinstance(value, list) or len(value) != 3:
            return None
        func_reference, args, kwargs = value
        if isinstance(func_reference, basestring) and isinstance(args, list) and isinstance(kwargs,
                                                                                            dict):
            return Task(func_reference, args, kwargs)
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
        return [self.func_reference, args, kwargs]

    @cached_property
    def wrapper(self):
        """:rtype: TaskFactory"""
        module_name, func_name = self.func_reference.rsplit('.', 1)
        m = __import__(module_name, fromlist=[func_name], level=0)
        return getattr(m, func_name)

    def run_once(self):
        """:returns: Either a new Task or a final result."""
        res = self.wrapper.call_now(*self.args, **self.kwargs)
        return res

    def percent(self):
        return self.wrapper.percent(*self.args, **self.kwargs)

    def __unicode__(self):
        return u'{} with {}, {}'.format(self.func_reference, self.args, self.kwargs)

    def __str__(self):
        return '{} with {}, {}'.format(self.func_reference, self.args, self.kwargs)


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


class TaskFactory(object):
    """
    A TaskFactory holds a reference to a function. It can generate Tasks or TaskQueues.

    >>> @task
    >>> def inc(x)
    >>>     return x + 1
    >>>
    >>> assert isinstance(inc, TaskFactory)
    >>> assert isinstance(inc(42), Task)
    >>> assert isinstance(inc.delay(42), TaskQueue)
    >>> assert isinstance(inc.call_now(42), 43)
    """
    def __init__(self, func, percent=None, description=None):
        """
        This instance is kind of static. Don't store anything volatile.
        :type description: str | unicode | None
        """
        self._orig_func = func
        self._percent = percent
        self._description = description

    def __call__(self, *args, **kwargs):
        return self.mk_task(args, kwargs)

    def mk_task(self, args, kwargs):
        """:rtype: Task"""
        func = self._orig_func.__module__ + '.' + self._orig_func.__name__
        return Task(func, list(args), kwargs)

    def get_description(self, args, kwargs):
        if self._description:
            return self._description.format(*args, **kwargs)
        else:
            name = self._orig_func.__name__.replace('_', ' ')
            return name

    def delay(self, *args, **kwargs):
        """
        Schedules the task. It will be executed soon.

        :returns: already scheduled TaskQueue object.
        :rtype: TaskQueue
        """
        obj = TaskQueue()
        obj.task = json.dumps(self.mk_task(args, kwargs).serialize())
        obj.description = self.get_description(args, kwargs)
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
    """
    Decorator for creating a TaskFactory.

    :param percent: a function called with the same arguments as the decorated function.
    :param description: A string describing the task.
    :return: inner or a TaskFactory.
    """
    def inner(func):
        return TaskFactory(func, *args, **kwargs)
    if kwargs:
        return inner
    else:
        return TaskFactory(args[0])


def chain_percent(values, total_count=None):
    assert len(values) >= 1
    total_count = total_count if total_count else len(values)

    current_tasks_percent = float(total_count - len(values)) / float(total_count)

    first = deserialize_task(values[0])
    first_percent = first.percent() / float(100)

    return (current_tasks_percent + first_percent / float(total_count)) * 100


@task(percent=chain_percent)
def chain(values, total_count=None):
    """
    Created a new task that executes all given tasks, one after another.

    :type values: list[Task]
    :returns: the result of the last task. Previous results will be ignored.
    """
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
