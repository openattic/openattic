# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import socket

from django.conf import settings
from django.db import models


class BaseHandler(object):
    """ Base RPC handler class.

        Any methods whose names do not start with an underscore (_) will
        be automatically exported via RPC.

        The name of the section this handler will reside in is defined
        by the _get_handler_name class method, which you will have to
        override in order to set the name.
    """
    def __init__(self, user, request=None):
        self.user = user
        self.request = request

    @classmethod
    def _get_handler_name(cls):
        return "bogus.Handler"


class ModelHandlerMeta(type):
    """ Handler meta class that keeps track of Model→Handler associations. """
    handlers = {}

    def __init__( cls, name, bases, attrs ):
        type.__init__( cls, name, bases, attrs )
        if 'model' in attrs and attrs['model'] is not None:
            ModelHandlerMeta.handlers[attrs['model']] = cls

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
    def _get_handler_name(cls):
        return cls.model._meta.app_label + '.' + cls.model._meta.object_name

    @classmethod
    def _get_handler_for_model(cls, model):
        """ Return the handler class for the given model. """
        return cls.__metaclass__.handlers[model]

    def _get_handler_instance(self, model):
        """ Return a Handler class *instance* for the given model. """
        return  ModelHandler._get_handler_for_model(model)(self.user, self.request)

    @classmethod
    def _get_object_by_id_dict(cls, id_dict):
        for model in cls.__metaclass__.handlers:
            if model._meta.app_label == id_dict['app'] and model._meta.object_name == id_dict['obj']:
                return model.objects.get(id=id_dict['id'])
        return None

    def idobj(self, numeric_id):
        """ Get an ID object for the object given by `numeric_id`. """
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

    def get(self, id):
        """ Return an object given by ID. """
        if not isinstance( id, dict ):
            id = {'id': int(id)}
        return self._getobj( self.model.objects.get(**id) )

    def get_ext(self, id):
        """ Return an object given by ID.
            Meant to be used in conjunction with ExtJS datastores.
        """
        if not isinstance( id, dict ):
            id = {'id': int(id)}
        data = {}
        obj = self.model.objects.get(**id)
        for field in obj._meta.fields:
            if self.fields is not None and field.name not in self.fields:
                continue
            if self.exclude is not None and field.name in self.exclude:
                continue

            value = getattr(obj, field.name)
            if isinstance( field, models.ForeignKey ):
                data[field.name] = unicode(value)
                if value is not None:
                    data[field.name + "_id"] = value.id
            else:
                data[field.name] = value

        data = self._override_get(obj, data)
        return { "success": True, "data": data }

    def _filter_queryset(self, kwds, queryset=None):
        if queryset is None:
            queryset = self.model.objects

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

            * __exclude__: **kwargs for an .exclude() call.
            * __fields__: *args for a .values() call.

            Any other fields will be passed as **kwargs to .filter().
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

    def filter_values(self, kwds, fields):
        """ Filter records using the specified keywords (see filter), but return only
            the fields named in the `fields` list (plus ID).
        """
        if "id" not in fields:
            fields.append("id")
        return list(self._filter_queryset(kwds).order_by(*self.order).values(*fields))

    def filter_combo(self, field, query, kwds):
        """ Filter method that is meant to be used in conjunction with ExtJS
            ComboBoxes. Combos can be filtered by any text the user enters,#
            which is passed in the `query` parameter.
            Before calling `filter`, this method augments the `kwds` dict
            by adding `field`__icontains = query.
        """
        if query:
            kwds[field + '__icontains'] = query
        return [ self._getobj(obj) for obj in self._filter_queryset(kwds).order_by(field) ]

    def all_values(self, fields):
        """ Return only the fields named in the `fields` list (plus ID).
        """
        if "id" not in fields:
            fields.append("id")
        return list(self.model.objects.all().order_by(*self.order).values(*fields))

    def remove(self, id):
        """ Delete an object given by ID. """
        return self.model.objects.get(id=id).delete()

    def _getobj(self, obj):
        """ Return the data for one given object. """
        if isinstance(obj, dict):
            return obj

        data = {}
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
                data[field.name] = value

        return self._override_get(obj, data)


    def create(self, data):
        """ Create a new object with values from the `data` dict. """
        return self._setobj( self.model(), data )

    def set(self, id, data):
        """ Update the object given by ID with values from the `data` dict. """
        return self._setobj( self.model.objects.get(id=id), data )

    def set_ext(self):
        """ Reads POST data from the request to update a given object.
            Meant to be used in conjunction with ExtJS forms.
        """
        if self.request is None:
            raise ValueError("Cannot access request")

        id = int(self.request.POST["id"])
        if id == -1:
            instance = None
        else:
            instance = self.model.objects.get(id=id)

        from django.forms.models import ModelFormMetaclass, ModelForm
        formclass = ModelFormMetaclass( self.model._meta.object_name + "Form", (ModelForm,), {
            'Meta': type("Meta", (object,), {"model": self.model})
            } )
        forminst = formclass(self.request.POST, instance=instance)
        if forminst.is_valid():
            forminst.save()
            return { "success": True }
        else:
            errdict = {}
            for errfld in forminst.errors:
               errdict[errfld] = "\n".join( forminst.errors[errfld] )
            return { "success": False, "errors": errdict }

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
