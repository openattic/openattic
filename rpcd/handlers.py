# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
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

from django.db import models


class BaseHandler(object):
    """ Base RPC handler class.

        Any methods whose names do not start with an underscore (_) will
        be automatically exported via RPC.

        The name of the section this handler will reside in is defined
        by the handler_name property.
    """
    def __init__(self, user, request=None):
        self.user = user
        self.request = request

    handler_name = "bogus.Handler"


class ModelHandlerMeta(type):
    """ Handler meta class that keeps track of Model→Handler associations. """
    handlers = {}

    def __init__( cls, name, bases, attrs ):
        type.__init__( cls, name, bases, attrs )
        if cls.model is not None:
            ModelHandlerMeta.handlers[cls.model] = cls
            if cls.handler_name == BaseHandler.handler_name:
                cls.handler_name = cls.model._meta.app_label + '.' + cls.model._meta.object_name

class ModelHandler(BaseHandler):
    """ Base Model aware RPC handler class. Inherits from BaseHandler and exports
        a sensible set of methods which can be used with every standard Django model.

        In order to change the data included in records, override the _idobj,
        _override_get and _override_set methods.

        The following class attributes exist:

        * model   (mandatory): The Model class to associate with this ModelHandler.
        * exclude (optional):  Fields that should never be included in get() results.
        * fields  (optional):  Only include fields named here in get() calls.
        * order   (optional):  Fields to order all() and filter() calls by.

        Section names will be generated from the Model automatically.
    """
    __metaclass__ = ModelHandlerMeta

    model   = None
    exclude = None
    fields  = None
    order   = tuple()

    @classmethod
    def _get_handler_for_model(cls, model):
        """ Return the handler class for the given model. """
        return cls.__metaclass__.handlers[model]

    def _get_handler_instance(self, model):
        """ Return a Handler class *instance* for the given model. """
        return  ModelHandler._get_handler_for_model(model)(self.user, self.request)

    @classmethod
    def _get_object_by_id_dict(cls, id_dict):
        model = models.get_model(id_dict['app'], id_dict['obj'])
        return model.objects.get(id=id_dict['id'])

    def _get_model_manager(self):
        """ Method that allows to override which Model manager is used. """
        return self.model.objects

    def idobj(self, numeric_id):
        """ Get an ID object for the object given by `numeric_id`. """
        return self._idobj( self._get_model_manager().get(id=numeric_id) )

    def ids(self):
        """ Get a list of all existing object IDs. """
        return [self._idobj(o) for o in self._get_model_manager().all().order_by(*self.order) ]

    def ids_filter(self, kwds):
        """ Get a list of existing object IDs, filtered according to kwds. """
        return [ self._idobj(obj) for obj in self._filter_queryset(kwds).order_by(*self.order) ]

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, '__unicode__': unicode(obj)}

    def all(self):
        """ Return all objects. """
        return [ self._getobj(obj) for obj in self._get_model_manager().all().order_by(*self.order) ]

    def get(self, id):
        """ Return an object given by ID. """
        if not isinstance( id, dict ):
            id = {'id': int(id)}
        return self._getobj( self._get_model_manager().get(**id) )

    def get_ext(self, id):
        """ Return an object given by ID.
            Meant to be used in conjunction with ExtJS datastores.
        """
        if id == -1:
            return {}
        if not isinstance( id, dict ):
            id = {'id': int(id)}
        data = {}
        obj = self._get_model_manager().get(**id)
        for field in obj._meta.fields:
            if self.fields is not None and field.name not in self.fields:
                continue
            if self.exclude is not None and field.name in self.exclude:
                continue

            value = getattr(obj, field.name)
            if isinstance( field, models.ForeignKey ):
                data[field.name + "__str"] = unicode(value)
                if value is not None:
                    data[field.name] = value.id
                else:
                    data[field.name] = -1
            else:
                data[field.name] = value

        data = self._override_get(obj, data)
        return { "success": True, "data": data }

    def _filter_queryset(self, kwds, queryset=None):
        if queryset is None:
            queryset = self._get_model_manager()

        if '__exclude__' in kwds:
            exclude_kwds = kwds['__exclude__']
            del kwds['__exclude__']
        else:
            exclude_kwds = None

        if '__fields__' in kwds:
            fields = kwds['__fields__']
            del kwds['__fields__']
        else:
            fields = None

        if kwds:
            queryset = queryset.filter(**kwds)
        if exclude_kwds:
            queryset = queryset.exclude(**exclude_kwds)
        if fields:
            queryset = queryset.values(*fields)
        return queryset

    def filter(self, kwds):
        """ Search for objects with the keywords specified in the kwds dict.

            `kwds` may contain the following special fields:

            * __exclude__: ``**kwargs`` for an :meth:`~django.db.models.query.QuerySet.exclude` call.
            * __fields__: ``*args`` for a :meth:`~django.db.models.query.QuerySet.values` call.

            Any other fields will be passed as ``**kwargs`` to :meth:`~django.db.models.query.QuerySet.filter`.
            See the `Django docs <https://docs.djangoproject.com/en/dev/topics/db/queries/>`_ for details.
        """
        return [ self._getobj(obj) for obj in self._filter_queryset(kwds).order_by(*self.order) ]

    def filter_range(self, start, limit, sort, dir, kwds ):
        """ Return a range of objects ordered by the `sort` field. """
        start = int(start)
        limit = int(limit)
        if dir == "DESC":
            sort = "-" + sort
        queryset = self._filter_queryset(kwds)
        total  = queryset.count()
        qryset = queryset.order_by(sort)[start:(start + limit)]
        return {
            'objects': [ self._getobj(obj) for obj in qryset ],
            'total':   total
            }

    def filter_combo(self, field, query, kwds):
        """ Filter method that is meant to be used in conjunction with ExtJS
            ComboBoxes. Combos can be filtered by any text the user enters,
            which is passed in the `query` parameter.
            Before calling `filter`, this method augments the `kwds` dict
            by adding ``<field>__icontains = <query>``.
        """
        if query:
            kwds[field + '__icontains'] = query
        return [ self._getobj(obj) for obj in self._filter_queryset(kwds).order_by(field) ]

    def all_values(self, fields):
        """ Return only the fields named in the `fields` list (plus ID).
        """
        if "id" not in fields:
            fields.append("id")
        return list(self._get_model_manager().all().order_by(*self.order).values(*fields))

    def remove(self, id):
        """ Delete an object given by ID. """
        return self._get_model_manager().get(id=id).delete()

    def _getobj(self, obj):
        """ Return the data for one given object. """
        if isinstance(obj, dict):
            return obj

        data = {'__unicode__': unicode(obj)}
        for field in obj._meta.fields + obj._meta.many_to_many:
            if self.fields is not None and field.name not in self.fields:
                continue
            if self.exclude is not None and field.name in self.exclude:
                continue

            value = getattr(obj, field.name)
            if isinstance( field, models.ManyToManyField ):
                data[field.name] = [
                    self._get_handler_instance(val.__class__)._idobj(val)
                    for val in value.all()
                    ]
            elif isinstance( field, models.ForeignKey ):
                if value is not None:
                    try:
                        handler = self._get_handler_instance(value.__class__)
                    except KeyError:
                        data[field.name] = unicode(value)
                    else:
                        data[field.name] = handler._idobj(value)
                else:
                    data[field.name] = None
            else:
                data[field.name] = value

        return self._override_get(obj, data)


    def create(self, data):
        """ Create a new object with values from the `data` dict. """
        return self._setobj( self.model(), data )

    def set(self, id, data):
        """ Update the object given by ID with values from the `data` dict. """
        return self._setobj( self._get_model_manager().get(id=id), data )

    def set_ext(self):
        """ Reads POST data from the request to update a given object.
            Meant to be used in conjunction with ExtJS forms.
        """
        if self.request is None:
            raise ValueError("Cannot access request")

        data = dict([ (key, self.request.POST[key])
                      for key in self.request.POST
                      if key not in ("id", "extAction", "extMethod", "extTID", "extType", "extUpload")
                    ])

        for field in self.model._meta.fields:
            if isinstance( field, models.ForeignKey ) and field.name in data:
                if data[field.name]:
                    handler = self._get_handler_instance(field.related.parent_model)
                    data[field.name] = handler.idobj(int(data[field.name]))
                else:
                    data[field.name] = None

        from django.core.exceptions import ValidationError

        objid = int(self.request.POST["id"])
        try:
            if objid == -1:
                idobj = self.create(data)
            else:
                idobj = self.set( objid, data )
        except ValidationError, err:
            errdict = {}
            for errfld in err.message_dict:
                errdict[errfld] = "\n".join( err.message_dict[errfld] )
            return { "success": False, "errors": errdict }
        else:
            return { "success": True, "id": idobj["id"] }

    set_ext.EXT_flags = {"formHandler": True}

    def _setobj(self, obj, data):
        """ Update the given object with values from the `data` dict. """
        for field in obj._meta.fields:
            if field.name in data:
                if isinstance( field, models.ForeignKey ):
                    if data[field.name] is not None:
                        setattr(obj, field.name, ModelHandler._get_object_by_id_dict(data[field.name]))
                    else:
                        setattr(obj, field.name, None)
                else:
                    setattr(obj, field.name, data[field.name])
        for field in obj._meta.many_to_many:
            if field.name in data:
                setattr(obj, field.name, [
                    ModelHandler._get_object_by_id_dict(idobj) for idobj in data[field.name]
                ])
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
