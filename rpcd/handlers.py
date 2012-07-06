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

import inspect
import new

from django.db import models

from ifconfig.models import Host
from peering.models import PeerHost

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
        for model in cls.__metaclass__.handlers:
            if model._meta.app_label == id_dict['app'] and model._meta.object_name == id_dict['obj']:
                return model.objects.get(id=id_dict['id'])
        return None

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
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name}

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
        return self._setobj( self._get_model_manager().get(id=id), data )

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
            instance = self._get_model_manager().get(id=id)

        from django.forms.models import ModelFormMetaclass, ModelForm
        formclass = ModelFormMetaclass( self.model._meta.object_name + "Form", (ModelForm,), {
            'Meta': type("Meta", (object,), {"model": self.model})
            } )
        forminst = formclass(self.request.POST, instance=instance)
        if forminst.is_valid():
            instance = forminst.save()
            return { "success": True, "id": instance.id }
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


class ProxyHandler(BaseHandler):
    def __init__(self, user, request=None):
        BaseHandler.__init__(self, user, request)
        self._proxies = {}

    def _convert_datetimes(self, obj):
        from xmlrpclib import DateTime as XmlDateTime
        from datetime import datetime as PyDateTime
        if isinstance( obj, XmlDateTime ):
            return PyDateTime( *obj.timetuple()[:7] )
        if isinstance( obj, dict ):
            for key in obj:
                obj[key] = self._convert_datetimes(obj[key])
            return obj
        if isinstance( obj, list ):
            return [ self._convert_datetimes(elem) for elem in obj ]
        return obj

    def _get_proxy_object(self, peer):
        if peer is None:
            raise PeerError("Cannot relay to localhost")
        if peer.id not in self._proxies:
            obj = peer
            for name in self.handler_name.split("."):
                obj = getattr(obj, name)
            self._proxies[peer.id] = obj
        return self._proxies[peer.id]

    def _call_allpeers_method(self, method, *args):
        ret = []
        for peer in self._get_relevant_peers():
            meth = getattr(self._get_proxy_object(peer), method)
            res = meth(*args)
            if isinstance(res, (tuple, list)):
                ret.extend( self._convert_datetimes( list( res ) ) )
            else:
                ret.append( self._convert_datetimes( res ) )
        return ret

    def _call_singlepeer_method(self, method, id, *args):
        peer  = self._find_target_host(id)
        meth = getattr(self._get_proxy_object(peer), method)
        return self._convert_datetimes( meth(id, *args) )

    def _get_relevant_peers(self):
        return PeerHost.objects.filter( name__in=[ host.name
            for host in Host.objects.filter(volumegroup__isnull=False) ] )

    def _find_target_host(self, id):
        raise NotImplemented("ProxyHandler::_find_target_host needs to be overridden!")



class ProxyModelHandler(ProxyHandler, ModelHandler):
    def _find_target_host(self, id):
        curr = self.model.all_objects.get(id=int(id))
        for field in self.model.objects.hostfilter.split('__'):
            curr = getattr( curr, field )
            if isinstance( curr, Host ):
                break
        return PeerHost.objects.get(name=curr.name)

    def idobj(self, numeric_id):
        return self._idobj( self.model.all_objects.get(id=numeric_id) )

    def ids(self):
        return [self._idobj(o) for o in self.model.all_objects.all().order_by(*self.order) ]

    def ids_filter(self, kwds):
        return [ self._idobj(obj) for obj in self._filter_queryset(kwds, self.model.all_objects).order_by(*self.order) ]

    def all(self):
        return self._call_allpeers_method("all")

    def filter(self, kwds):
        return self._call_allpeers_method("filter", kwds)

    def get(self, id):
        return self._call_singlepeer_method("get", id)

    def get_ext(self, id):
        if id == -1:
            return {}
        peer = self._find_target_host(id)
        return self._convert_datetimes( self._get_proxy_object(peer).get_ext(id) )

    def filter_range(self, start, limit, sort, dir, kwds ):
        return self._call_allpeers_method("filter_range", start, limit, sort, dir, kwds)

    def filter_combo(self, field, query, kwds):
        return self._call_allpeers_method("filter_combo", field, query, kwds)

    def all_values(self, fields):
        return self._call_allpeers_method("all_values", fields)

    def remove(self, id):
        return self._call_singlepeer_method("remove", id)

    def set(self, id, data):
        if "id" in data:
            raise KeyError("Wai u ID")
        return self._call_singlepeer_method("set", id, data)

    def set_ext(self):
        """ Reads POST data from the request to update a given object.
            Meant to be used in conjunction with ExtJS forms.
        """
        if self.request is None:
            raise ValueError("Cannot access request")

        data = dict([ (key, self.request.POST[key])
                      for key in self.request.POST
                      if key not in ("extAction", "extMethod", "extTID", "extType", "extUpload")
                    ])

        for field in self.model._meta.fields:
            if isinstance( field, models.ForeignKey ):
                handler = self._get_handler_instance(field.related.parent_model)
                data[field.name] = handler.idobj(int(data[field.name]))

        objid = int(data["id"])
        del data["id"]
        if objid == -1:
            idobj = self.create(data)
        else:
            idobj = self.set( objid, data )

        return { "success": True, "id": idobj["id"] }

    set_ext.EXT_flags = {"formHandler": True}

    def create(self, data):
        if "id" in data:
            raise KeyError("Wai u ID")
        # Find the peer by walking through the given data
        fields = self.model.objects.hostfilter.split('__')
        target_model = self.model._meta.get_field_by_name(fields[0])[0].related.parent_model
        curr = target_model.all_objects.get(id=data[fields[0]]["id"])
        for field in fields[1:]:
            curr = getattr( curr, field )
            if isinstance( curr, Host ):
                break
        peer = PeerHost.objects.get(name=curr.name)
        return self._convert_datetimes( self._get_proxy_object(peer).create(data) )




__TEMPLATE_ALLPEERS = """def %(name)s( self, %(args)s ):
    return self._call_allpeers_method("%(name)s", %(args)s)
"""

__TEMPLATE_SINGLEPEER = """def %(name)s( self, %(args)s ):
    return self._call_singlepeer_method("%(name)s", %(args)s)
"""

def proxy_for(other_handler):
    """ Create a class decorator that, when called, copies all class variables
        and methods from other_handler to proxy_handler. Methods will be wrapped
        and then called either on all peers, or if their first argument is "id",
        then on one single peer.

        Usage:

            class SomeHandler(ModelHandler):
                model = SomeModel

                def yadda(self, id):
                    # do something

            @proxy_for(SomeHandler)
            def SomeProxy(ProxyModelHandler):
                model = SomeModel

        In this example, @proxy_for would copy the ``yadda'' function from
        SomeHandler to SomeProxy, wrapping it to be called on the one host
        that currently owns the model instance.

        Note that the ``model'' variable *needs* to be set when the class is
        initially created, so proxy_for cannot be used for it.
    """

    def _wrap_singlepeer_method(method):
        # Using functools.wraps would destroy the argspec, so we have to do it the hard way.
        # Inspect the original method to get its arguments
        args = inspect.getargspec( method ).args[1:]
        # format the template string accordingly and get a code object
        code = compile( __TEMPLATE_SINGLEPEER % {
            "args": ', '.join(args),
            "name": method.__name__
            }, "<string>", "single" )
        # run the code using evaldict as its namespace
        evaldict = {}
        exec code in evaldict
        # retrieve the defined method from the namespace and return it
        return evaldict[method.__name__]

    def _wrap_allpeers_method(method):
        args = inspect.getargspec( method ).args[1:]
        code = compile( __TEMPLATE_ALLPEERS % {
            "args": ', '.join(args),
            "name": method.__name__
            }, "<string>", "single" )
        evaldict = {}
        exec code in evaldict
        return evaldict[method.__name__]

    def class_decorator(proxy_handler):
        proxy_handler.handler_name = other_handler.handler_name

        # Copy public members from other_handler to proxy_handler
        for membername, member in inspect.getmembers(other_handler):
            if membername[0] == '_' or hasattr(proxy_handler, membername):
                continue
            if not inspect.ismethod(member):
                # Non-Methods are simply copied
                setattr(proxy_handler, membername, member)
            else:
                # Methods need to be wrapped
                argspec = inspect.getargspec(member)
                if argspec.args[:2] == ['self', 'id']:
                    wrapper = _wrap_singlepeer_method(member)
                else:
                    wrapper = _wrap_allpeers_method(member)
                setattr(proxy_handler, membername, new.instancemethod(wrapper, None, proxy_handler))

        return proxy_handler

    return class_decorator
