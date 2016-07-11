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
import ast
import json
from itertools import product

import django
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.db.models.base import ModelState
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

    def _data(self):
        objects = self.model.get_all_objects(self._context, query=self._query)
        self_pointer = LazyProperty.QuerySetPointer(objects)
        for obj in objects:
            #  Because we're calling the model constructors ourselves, django thinks that
            #  the objects are not in the database. We need to "hack" this.
            obj._state.adding = False
            obj._query_set_pointer = self_pointer

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

        filtered = [obj for obj in self._data()
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
                '{} matching query "{}" does not exist.'.format(self.model._meta.object_name, kwargs))
        raise self.model.MultipleObjectsReturned(
            "get() returned more than one %s -- it returned %s!" % (
                self.model._meta.object_name,
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


class LazyProperty(object):
    """
    See also: django.db.models.query_utils.DeferredAttribute

    Internally used by @bulk_attribute_setter().
    """
    class QuerySetPointer(object):
        def __init__(self, target):
            self.target = target

    def __init__(self, field_name, eval_func):
        self.field_name = field_name
        self.eval_func = eval_func

    def __get__(self, instance, owner=None):
        """
        runs eval_func which fills some lazy properties.
        """
        query_set = instance._query_set_pointer.target
        if self.field_name in instance.__dict__:
            return instance.__dict__[self.field_name]

        self.eval_func(instance, query_set)
        if self.field_name not in instance.__dict__:
            raise KeyError('LazyProperty: {} did not set {} of {}'.format(self.eval_func, self.field_name, instance))
        return instance.__dict__[self.field_name]

    def __set__(self, instance, value):
        """
        Deferred loading attributes can be set normally (which means there will
        never be a database lookup involved.
        """
        instance.__dict__[self.field_name] = value


def bulk_attribute_setter(*filed_names):
    """
    The idea @behind bulk_attribute_setter is to delay expensive calls to librados, until someone really needs
    the information gathered in this call. If the attribute is never used, the call will never be executed. In general,
    this is called lazy execution.

    Before, NodbQuerySet called self.model.get_all_objects to generate a list of objects.
    The implementations of get_all_objects were calling the librados commands to fill all attributes, even if they were
    never accessed.

    Because a field may never be accessed, this can generate better performance than caching, especially if the cache is
    cold.

    The bulk_attribute_setter decorator can be used like so:
    >>> class MyModel(NodbModel):
    >>>     my_filed = models.IntegerField()
    >>>
    >>>     @bulk_attribute_setter('my_filed')
    >>>     def set_my_filed(self, objs):
    >>>         self.my_filed = 42

    Keep in mind, that you can set the my_field attribute on all objects, not just self.

    The decorator modifies the model to look like this:
    >>> def set_my_filed(self, objs):
    >>>     self.my_filed = 42
    >>>
    >>> class MyModel(NodbModel):
    >>>     my_filed = models.IntegerField()
    >>>     set_my_filed = LazyPropertyContributor(['my_filed'], set_my_filed)

    A LazyPropertyContributor property implements the contribute_to_class method, which modifies the model itself
    to look like so:
    >>> class MyModel(NodbModel):
    >>>     my_filed = LazyProperty('my_filed', set_my_filed)

    The my_filed filed is not overwritten, because the fields are already moved into the _meta class at this point. If
    someone then accesses the my_field attribute, LazyProperty.__get__ is called, which then calls set_my_field to set
    the field, as if one had written:
    >>> instances = MyModel.objects.all()
    >>> instances[0].my_field = set_my_filed(instances[0], instances)

    For example, get_all_objects generates a QuerySet like this:

    id	name	  disk_usage
    0	'foo'     LazyProperty('disk_usage')
    1	'bar'	  LazyProperty('disk_usage')

    When accessing bar.disk_usage, LazyProperty calls `ceph df` and fills the queryset like so:

    id	name	disk_usage
    0	'foo'   1MB
    1	'bar'  	2MB
    """

    class LazyPropertyContributor(object):
        def __init__(self, field_names, func):
            self.field_names = field_names
            self.func = func

        def contribute_to_class(self, cls, name, virtual_only=False):
            for name in self.field_names:
                setattr(cls, name, LazyProperty(name, self.func))

    def decorator(func):
        return LazyPropertyContributor(filed_names, func)

    return decorator


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

    def get_modified_fields(self, **kwargs):
        """
        Returns a dict of fields, which have changed. There are two known problems:

        1. There is a race between get_modified_fields and the call to this.save()
        2. A type change, e.g. str and unicode is not handled.

        :param kwargs: used to retrieve the original. default: `pk`
        :rtype: tuple[dict[str, Any], T <= NodbModel]
        :return: A tuple consisting of the diff and the original model instance
        """
        if not kwargs:
            kwargs['pk'] = self.pk

        original = self.__class__.objects.get(**kwargs)
        return {
            field.attname: getattr(self, field.attname)
            for field
            in self.__class__._meta.fields
            if field.editable and getattr(self, field.attname) != getattr(original, field.attname)
        }, original

    def set_read_only_fields(self, obj, include_pk=True):
        """
        .. example::
            >>> insert = self.id is None
            >>> diff, original = self.get_modified_fields(name=self.name) if insert else self.get_modified_fields()
            >>> if not insert:
            >>>     self.set_read_only_fields()
        """
        if include_pk:
            self.pk = obj.pk

        for field in self.__class__._meta.fields:
            if not field.editable and getattr(self, field.attname) != getattr(obj, field.attname):
                setattr(self, field.attname, getattr(obj, field.attname))

    @classmethod
    def make_model_args(cls, json_result):

        def validate_field(field, json_result, score_or_underscore):
            # '-' is not supported for field names, but used by ceph.
            json_key = field.attname.replace('_', score_or_underscore)
            if json_key not in json_result:
                return False
            try:
                field.to_python(json_result[json_key])
                return True
            except ValidationError:
                return False

        return {
            field.attname: field.to_python(json_result[field.attname.replace('_', score_or_underscore)])
            for (field, score_or_underscore)
            in product(cls._meta.fields, '_-')
            if validate_field(field, json_result, score_or_underscore)
            }

    def __init__(self, *args, **kwargs):
        # super(NodbModel, self).__init__(*args, **kwargs)
        self._state = ModelState()

        self.__dict__.update(kwargs)

    def save(self, force_insert=False, force_update=False, using=None,
             update_fields=None):
        """This base implementation does nothing, except telling django that self is now successfully inserted."""
        self._state.adding = False



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
        def check_base_type(val):
            if not isinstance(val, self.base_type):
                raise exceptions.ValidationError(
                    "invalid JSON type. Got {}, expected {}".format(type(parsed), self.base_type),
                    code='invalid',
                    params={'value': value},
                )
            return val

        if value is None:
            return self.base_type()
        if isinstance(value, self.base_type):
            return value

        try:
            parsed = json.loads(value)
            return check_base_type(parsed)
        except ValueError:
            try:
                # Evil hack to support PUT requests to the Browsable API of the django-rest-framework
                # as we cannot determine if restapi.JsonField.tonative() is called for json or for rendering the
                # form.
                obj = ast.literal_eval(value)
                return check_base_type(obj)
            except ValueError:
                raise exceptions.ValidationError(
                    "invalid JSON",
                    code='invalid',
                    params={'value': value},
                )

    def deconstruct(self):
        name, path, args, kwargs = super(JsonField, self).deconstruct()
        kwargs['base_type'] = self.base_type
        return name, path, args, kwargs

