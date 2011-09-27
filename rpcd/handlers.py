# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import socket

from django.conf import settings
from django.db import models

class BaseHandlerMeta(type):
    """ Handler meta class that keeps track of Model→Handler associations. """
    handlers = {}

    def __init__( cls, name, bases, attrs ):
        type.__init__( cls, name, bases, attrs )
        if 'model' in attrs:
            BaseHandlerMeta.handlers[attrs['model']] = cls

class BaseHandler(object):
    """ Base RPC handler class.

        Any methods whose names do not start with an underscore (_) will
        be automatically exported via RPC.

        In order to change the data included in records, override the _idobj,
        _override_get and _override_set methods.
    """
    __metaclass__ = BaseHandlerMeta

    exclude = None
    fields  = None
    order   = tuple()

    def __init__(self, user):
        self.user = user

    @classmethod
    def _get_handler_for_model(cls, model):
        """ Return the handler class for the given model. """
        return cls.__metaclass__.handlers[model]

    @classmethod
    def _get_object_by_id_dict(cls, id_dict):
        for model in cls.__metaclass__.handlers:
            if model._meta.app_label == id_dict['app'] and model._meta.object_name == id_dict['obj']:
                return model.objects.get(id=id_dict['id'])
        return None

    def idobj(self, numeric_id):
        """ Get an ID object for the object given by numeric_id. """
        return self._idobj( self.model.objects.get(id=numeric_id) )

    def ids(self):
        """ Get a list of all existing object IDs. """
        return [self._idobj(o) for o in self.model.objects.all().order_by(*self.order) ]

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name}

    def all(self):
        """ Return all objects. """
        return [ self._getobj(obj) for obj in self.model.objects.all().order_by(*self.order) ]

    def range(self, start, limit, sort, dir ):
        """ Return a range of objects ordered by the `sort' field. """
        start = int(start)
        limit = int(limit)
        if dir == "DESC":
            sort = "-" + sort
        total  = self.model.objects.all().count()
        qryset = self.model.objects.all().order_by(sort)[start:(start + limit)]
        return {
            'objects': [ self._getobj(obj) for obj in qryset ],
            'total':   total
            }

    def range_values(self, start, limit, sort, dir, fields):
        """ Return a range of objects ordered by the `sort' field. """
        start = int(start)
        limit = int(limit)
        if dir == "DESC":
            sort = "-" + sort
        total  = self.model.objects.all().count()
        qryset = self.model.objects.all().order_by(sort)[start:(start + limit)].values(*fields)
        return {
            'objects': list(qryset),
            'total':   total
            }

    def get(self, id):
        """ Return an object given by ID. """
        if not isinstance( id, dict ):
            id = {'id': int(id)}
        return self._getobj( self.model.objects.get(**id) )

    def filter(self, kwds):
        """ Search for objects with the keywords specified in the kwds dict. """
        return [ self._getobj(obj) for obj in self.model.objects.filter(**kwds).order_by(*self.order) ]

    def filter_values(self, kwds, fields):
        """ Filter records using the specified keywords (see filter), but return only
            the fields named in the `fields' list (plus ID).
        """
        if "id" not in fields:
            fields.append("id")
        return list(self.model.objects.filter(**kwds).order_by(*self.order).values(*fields))

    def all_values(self, fields):
        """ Return only the fields named in the `fields' list (plus ID).
        """
        if "id" not in fields:
            fields.append("id")
        return list(self.model.objects.all().order_by(*self.order).values(*fields))

    def remove(self, id):
        """ Delete an object given by ID. """
        return self.model.objects.get(id=id).delete()

    def _getobj(self, obj):
        """ Return the data for one given object. """
        data = {}
        for field in obj._meta.fields:
            if self.fields is not None and field.name not in self.fields:
                continue
            if self.exclude is not None and field.name in self.exclude:
                continue

            value = getattr(obj, field.name)
            if isinstance( field, models.ForeignKey ):
                if value is not None:
                    try:
                        handler = BaseHandler._get_handler_for_model(value.__class__)(self.user)
                    except KeyError:
                        data[field.name] = unicode(value)
                    else:
                        data[field.name] = handler._idobj(value)
            else:
                data[field.name] = value

        return self._override_get(obj, data)


    def create(self, data):
        """ Create a new object with values from the data dict. """
        return self._setobj( self.model(), data )

    def set(self, id, data):
        """ Update the object given by ID with values from the data dict. """
        return self._setobj( self.model.objects.get(id=id), data )

    def _setobj(self, obj, data):
        """ Update the given object with values from the data dict. """
        for field in obj._meta.fields:
            if field.name in data:
                if isinstance( field, models.ForeignKey ):
                    if data[field.name] is not None:
                        setattr(obj, field.name, BaseHandler._get_object_by_id_dict(data[field.name]))
                    else:
                        setattr(obj, field.name, None)
                else:
                    setattr(obj, field.name, data[field.name])
        self._override_set(obj, data)
        obj.full_clean()
        obj.save()
        return self._idobj(obj)

    def _override_get(self, obj, data):
        """ Stub method called right before _getobj returns the data dict.
            Override this to change the data from a Handler subclass.
        """
        return data

    def _override_set(self, obj, data):
        """ Stub method called right before _getobj calls obj.save(). """
        return
