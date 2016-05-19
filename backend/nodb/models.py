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

import django
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.db.models.query import QuerySet
from django.core import exceptions
from django.db.models.fields import Field
from django.utils.functional import cached_property


class NoDbQuery(object):
    def __init__(self, q=None, ordering=None):
        self._q = q
        self._ordering = [] if ordering is None else ordering

    def can_filter(self):
        return True

    def add_q(self, q):
        self._q = q if self._q is None else self._q & q

    def clone(self):
        tmp = NoDbQuery()
        tmp._q = self._q.clone() if self._q is not None else None
        tmp._ordering = self._ordering[:]
        return tmp

    def clear_ordering(self, force_empty=None):
        self._ordering = []

    def add_ordering(self, *keys):
        self._ordering += keys

    @property
    def ordering(self):
        return self._ordering

    @property
    def q(self):
        """:rtype: Q"""
        return self._q

    def set_empty(self):
        self.clear_ordering()
        self._q = None

    def __str__(self):
        return "<NoDbQuery q={}, ordering={}>".format(self._q, self._ordering)


class NodbQuerySet(QuerySet):

    def __init__(self, model, using=None, hints=None, request=None, context=None):
        self.model = model
        self._context = context
        self._current = 0
        self._query = NoDbQuery()
#        self.oInstance = QuerySet()

    @cached_property
    def _max(self):
        return len(self._filtered_data) - 1

    @cached_property
    def _data(self):
        objects = self.model.get_all_objects(self._context, query=self._query)
        for obj in objects:
            #  Because we're calling the model constructors ourselves, django thinks that
            #  the objects are not in the database. We need to "hack" this.
            obj._state.adding = False
        return objects

    @cached_property
    def _filtered_data(self):
        """
        Each Q child consists of either another Q, `attr__iexact` or `model__attr__iexact` or `attr`
        """

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
            def negate(res):
                return not res if q.negated else res

            if q is None:
                return True
            elif isinstance(q, tuple):
                return filter_impl(q[0].split('__'), q[1], obj)
            elif q.connector == "AND":
                return negate(reduce(lambda l, r: l and filter_one_q(r, obj), q.children, True))
            else:
                return negate(reduce(lambda l, r: l or filter_one_q(r, obj), q.children, False))

        filtered = [obj for obj in self._data
                    if filter_one_q(self._query.q, obj)]

        for order_key in self.query.ordering[::-1]:
            if order_key.startswith("-"):
                order_key = order_key[1:]
                filtered.sort(key=lambda obj: getattr(obj, order_key), reverse=True)
            else:
                filtered.sort(key=lambda obj: getattr(obj, order_key))

        return filtered

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
        my_clone._query = self._query.clone()
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

    def exists(self):
        return bool(self._filtered_data)

    @property
    def query(self):
        return self._query

    def filter(self, *args, **kwargs):
        return super(NodbQuerySet, self).filter(*args, **kwargs)

    def all(self):
        return super(NodbQuerySet, self).all()

    def __str__(self):
        return super(NodbQuerySet, self).__str__()

    def __repr__(self):
        return super(NodbQuerySet, self).__repr__()



if django.VERSION[1] == 6:
    from django.db.models.manager import Manager
    base_manager_class = Manager
else:
    from django.db.models.manager import BaseManager
    base_manager_class = BaseManager.from_queryset(NodbQuerySet)


class NodbManager(base_manager_class):

    use_for_related_fields = True
    nodb_context = None

    @classmethod
    def set_nodb_context(cls, context):
        cls.nodb_context = context

    def get_queryset(self):
        if django.VERSION[1] == 6:
            return NodbQuerySet(self.model, using=self._db, context=NodbManager.nodb_context)
        else:
            return self._queryset_class(self.model, using=self._db, hints=self._hints,
                                        context=NodbManager.nodb_context)




class NodbModel(models.Model):

    objects = NodbManager()

    class Meta:
        # Needs to be true to be able to create the necessary database tables by using Django
        # migrations. The table is necessary to be able to use Django model relations.
        managed = True
        abstract = True

    @staticmethod
    def get_all_objects(context, query):
        msg = 'Every NodbModel must implement its own get_all_objects() method.'
        raise NotImplementedError(msg)

    def get_modified_fields(self):
        """
        Returns a dict of fields, which have changed. There are two known problems:

        1. There is a race between get_modified_fields and the call to this.save()
        2. A type change, e.g. str and unicode is not handled.

        :rtype: tuple[dict[str, Any], T <= NodbModel]
        :return: A tuple consisting of the diff and the original model instance
        """
        original = self.__class__.objects.get(pk=self.pk)
        return {
            field.attname: getattr(self, field.attname)
            for field
            in self.__class__._meta.fields
            if getattr(self, field.attname) != getattr(original, field.attname)
        }, original

    @classmethod
    def make_model_args(cls, json_result):

        def validate_field(field, json_result):
            # '-' is not supported for field names, but used by ceph.
            json_key = field.attname.replace('_', '-')
            if json_key not in json_result:
                return False
            try:
                field.to_python(json_result[json_key])
                return True
            except ValidationError:
                return False

        return {
            field.attname: field.to_python(json_result[field.attname.replace('_', '-')])
            for field
            in cls._meta.fields
            if validate_field(field, json_result)
            }


class JsonField(Field):
    empty_strings_allowed = False

    def __init__(self, *args, **kwargs):
        """
        :param base_type: list | dict
        :type base_type: type
        :rtype: JsonField[T]
        """
        self.base_type = kwargs['base_type']
        del kwargs['base_type']
        super(JsonField, self).__init__(*args, **kwargs)

    def to_python(self, value):
        """:rtype: T"""
        if value is None:
            return self.base_type()
        if isinstance(value, self.base_type):
            return value

        try:
            parsed = json.loads(value)
            if isinstance(parsed, self.base_type):
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
