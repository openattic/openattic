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
from itertools import ifilter

import django
from django.db import models
from django.db.models import Q
from django.db.models.query import QuerySet
from django.core import exceptions
from django.db.models.fields import Field
from django.utils.functional import cached_property


class NoDbQuery(object):
    def __init__(self):
        self._q = None

    def can_filter(self):
        return True

    def add_q(self, q):
        self._q = q if self._q is None else self._q | q

    @property
    def q(self):
        return self._q



class NodbQuerySet(QuerySet):

    def __init__(self, model, using=None, hints=None, request=None, context=None):
        self.model = model
        self._context = context
        self._current = 0
        self._max = len(self._data) - 1
        self._query = NoDbQuery()

    @cached_property
    def _data(self):
        return self.model.get_all_objects(self._context)

    @cached_property
    def _filtered_data(self):
        """
        Each Q child consists of either another Q, `attr__iexact` or `model__attr__iexact` or `attr`
        """
        if not self._query.q:
            return self._data

        def filter_impl(keys, value, obj):
            assert keys
            attr = getattr(obj, keys[0])
            if attr is None:
                raise AttributeError('Attribute {} dows not exists for {}'.format(keys[0], obj.__class__))
            elif isinstance(attr, models.Model):
                return filter_impl(keys[1:], value, attr)
            else:
                modifier = keys[1] if len(keys) > 1 else "exact"
                if modifier == "exact":
                    return attr == attr.__class__(value)
                elif modifier == "istartswith":
                    return attr.startswith(value)
                elif modifier == "icontains":
                    return value in attr
                else:
                    raise ValueError('Unsupported Modifier {}.'.format(modifier))

        def filter_one_q(q, obj):
            """
            Args:
                q (Q):
                obj NodbModel:

            """
            if isinstance(q, tuple):
                return filter_impl(q[0].split('__'), q[1], obj)
            elif q.connector == "AND":
                return reduce(lambda l, r: l and filter_one_q(r, obj), q.children, True)
            else:
                return reduce(lambda l, r: l or filter_one_q(r, obj), q.children, False)

        return [obj for obj in self._data
                if filter_one_q(self._query.q, obj)]

    def __iter__(self):
        return self

    def __len__(self):
        return len(self._filtered_data)

    def next(self):
        if self._current > self._max:
            raise StopIteration
        else:
            self._current += 1
            return self._filtered_data[self._current - 1]

    def __getitem__(self, index):
        return self._filtered_data[index]

    def __getattribute__(self, attr_name):
        try:  # Just return own attributes.
            own_attr = super(NodbQuerySet, self).__getattribute__(attr_name)
        except AttributeError:
            pass
        else:
            return own_attr

        if attr_name in vars(self) or attr_name in vars(NodbQuerySet):
            attr = self.oInstance.__getattribute__(attr_name)
            return attr

        msg = 'Call to an attribute `{}` of {} which isn\'t intended to be accessed directly.'
        msg = msg.format(attr_name, self.__class__)
        raise AttributeError(msg)

    def _clone(self, klass=None, setup=False, **kwargs):
        my_clone = NodbQuerySet(self.model, context=self._context)
        my_clone._query = self._query
        return my_clone

    def count(self):
        return len(self._filtered_data)

    def get(self, **kwargs):
        """Return a single object filtered by kwargs."""
        filtered_data = self.filter(**kwargs)

        # Thankfully copied from
        # https://github.com/django/django/blob/1.7/django/db/models/query.py#L351
        num = len(filtered_data)
        if num == 1:
            return filtered_data[0]
        if not num:
            raise self.model.DoesNotExist(
                "%s matching query does not exist." %
                self.model._meta.object_name)
        raise self.model.MultipleObjectsReturned(
            "get() returned more than one %s -- it returned %s!" % (
                self.mode_._meta.object_name,
                num
            )
        )

    @property
    def query(self):
        return self._query

    def filter(self, *args, **kwargs):
        return super(NodbQuerySet, self).filter(*args, **kwargs)

    def all(self):
        return super(NodbQuerySet, self).all()


if django.VERSION[1] == 6:
    from django.db.models.manager import Manager
    base_manager_class = Manager
else:
    from django.db.models.manager import BaseManager
    base_manager_class = BaseManager.from_queryset(NodbQuerySet)


class NodbManager(base_manager_class):

    use_for_related_fields = True

    def all(self, context=None):
        """
        Args:
            context (dict): The context
        """
        return self.get_queryset(context)

    def get_queryset(self, context=None):
        if django.VERSION[1] == 6:
            return NodbQuerySet(self.model, using=self._db, context=context)
        else:
            return self._queryset_class(self.model, using=self._db, hints=self._hints,
                                        context=context)


class NodbModel(models.Model):

    objects = NodbManager()

    class Meta:
        # Needs to be true to be able to create the necessary database tables by using Django
        # migrations. The table is necessary to be able to use Django model relations.
        managed = True
        abstract = True

    @staticmethod
    def get_all_objects():
        msg = 'Every NodbModel must implement its own get_all_objects() method.'
        raise NotImplementedError(msg)


class DictField(Field):
    empty_strings_allowed = False

    def to_python(self, value):
        if value is None:
            return dict()
        if isinstance(value, dict):
            return value

        try:
            parsed = json.loads(value)
            if parsed is not None:
                return parsed
        except ValueError:
            raise exceptions.ValidationError(
                "invalid JSON",
                code='invalid',
                params={'value': value},
            )

        raise exceptions.ValidationError(
            "invalid JSON",
            code='invalid',
            params={'value': value},
        )
