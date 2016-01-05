# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

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

import logging
import socket
import errno
import sys

from operator import or_

from django.db import models
from django.db.models import Q
from django.contrib.contenttypes import generic
from django.contrib.contenttypes.models import ContentType

from ifconfig.models import Host
from peering.models import PeerHost, PeerError

from xmlrpclib import Fault
from httplib import BadStatusLine
from rpcd.exceptionhelper import translate_exception

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
        try:
            unc = unicode(obj)
        except TypeError:
            raise ValueError("class '%s' object %d returned a strange __unicode__" % (type(obj), obj.id))
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, '__unicode__': unc}

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
        for field in obj._meta.fields + obj._meta.virtual_fields:
            if self.fields is not None and field.name not in self.fields:
                continue
            if self.exclude is not None and field.name in self.exclude:
                continue

            value = getattr(obj, field.name)
            if isinstance( field, (models.ForeignKey, generic.GenericForeignKey) ):
                data[field.name + "__str"] = unicode(value)
                if value is not None:
                    data[field.name] = value.id
                else:
                    data[field.name] = -1
            else:
                data[field.name] = value

        data = self._override_get(obj, data)
        return { "success": True, "data": data }

    def _filter_virtual(self, kwds):
        """ Support filtering by GenericForeignKeys. """
        for field in self.model._meta.virtual_fields:
            if field.name in kwds:
                if isinstance( field, generic.GenericForeignKey ):
                    if not isinstance( kwds[field.name], dict ) \
                       or "app" not in kwds[field.name] \
                       or "obj" not in kwds[field.name] \
                       or "id" not in kwds[field.name]:
                        raise KeyError("The argument for '%s' needs to be an ID object" % field.name)
                    target_obj = ModelHandler._get_object_by_id_dict(kwds[field.name])
                    del kwds[field.name]
                    kwds[field.ct_field] = ContentType.objects.get_for_model(target_obj.__class__)
                    kwds[field.fk_field] = target_obj.id
                else:
                    raise TypeError("Don't know how to handle virtual field of type '%s'" % type(field))
        return kwds

    def _filter_foreignkey(self, kwds):
        model = self.model()
        for kwd in kwds:
            model = self.model()

            for split in kwd.split('__'):
                if model is not None:
                    for field in model._meta.fields:
                        if field.name == split and isinstance(field, models.ForeignKey):
                            model = field.rel.to
                else:
                    raise LookupError("Filtering by the foreign keys '%s' is not valid" % kwds)

            if isinstance(kwds[kwd], dict):
                if "id" in kwds[kwd]:
                    kwds[kwd] = kwds[kwd]["id"]
                else:
                    raise LookupError("No id found in object dictionary '%s'" % kwds[kwd])
        return kwds

    def get_or_create(self, get_values, create_values):
        """ Try to get an object filtered by `get_values'. If none exists,
            create it using data from both `get_values' and `create_values'.
        """
        # is implemented solely through functions provived by the modelhandler, and therefore works when
        # inherited by the proxymodelhandler as well
        result = self._filter_queryset(get_values)

        if len(result) == 1:
            result = self._idobj(result[0])
        else:
            get_values.update(create_values)
            result = self.create(get_values)

        return result

    def _filter_queryset(self, kwds, queryset=None):
        kwds = kwds.copy()

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

        if '__or__' in kwds:
            if isinstance(kwds['__or__'], dict):
                orlist = [kwds['__or__']]
            else:
                orlist = kwds['__or__']
            del kwds['__or__']
        else:
            orlist = None

        if kwds:
            self._filter_virtual(kwds)
            self._filter_foreignkey(kwds)
            queryset = queryset.filter(**kwds)

        if exclude_kwds:
            self._filter_virtual(exclude_kwds)
            self._filter_foreignkey(exclude_kwds)
            queryset = queryset.exclude(**exclude_kwds)

        if orlist:
            for ordict in orlist:
                self._filter_virtual(ordict)
                self._filter_foreignkey(ordict)
                queryset = queryset.filter( reduce(or_, [
                    Q(**{key: ordict[key]}) for key in ordict
                ] ) )

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
        for field in obj._meta.fields + obj._meta.many_to_many + obj._meta.virtual_fields:
            if self.fields is not None and field.name not in self.fields:
                continue
            if self.exclude is not None and field.name in self.exclude:
                continue

            try:
                value = getattr(obj, field.name)
                if isinstance( field, models.ManyToManyField ):
                    data[field.name] = [
                        self._get_handler_instance(val.__class__)._idobj(val)
                        for val in value.all()
                        ]
                elif isinstance( field, (models.ForeignKey, generic.GenericForeignKey) ):
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
            except Exception, err:
                logging.error("Got exception '%s' when querying '%s' for field '%s'" % (
                              unicode(err), repr(obj), field.name
                              ))
                raise

        for rel_m2m in obj._meta.get_all_related_many_to_many_objects():
            fname = rel_m2m.get_accessor_name()
            data[fname] = [
                self._get_handler_instance(val.__class__)._idobj(val)
                for val in getattr(obj, fname).all()
                ]

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

        for field in self.model._meta.fields + self.model._meta.virtual_fields:
            if isinstance( field, (models.ForeignKey, generic.GenericForeignKey) ) and field.name in data:
                if data[field.name]:
                    handler = self._get_handler_instance(field.related.parent_model)
                    data[field.name] = handler.idobj(int(data[field.name]))
                else:
                    data[field.name] = None
            elif isinstance( field, models.BooleanField ):
                data[field.name] = field.name in data and data[field.name] == "on"

        from django.core.exceptions import ValidationError

        objid = int(self.request.POST["id"])
        try:
            if objid == -1:
                idobj = self.create(data)
            else:
                idobj = self.set( objid, data )
        except ValidationError, err:
            errdict = {}
            if hasattr(err, "message_dict"):
                for errfld in err.message_dict:
                    errdict[errfld] = "\n".join( err.message_dict[errfld] )
            return { "success": False, "errors": errdict, "err": unicode(err) }
        else:
            return { "success": True, "id": idobj["id"] }

    set_ext.EXT_flags = {"formHandler": True}

    def _set_m2m(self, obj, field, data):
        if field in data:
            if not isinstance(data[field], (tuple, list)):
                raise TypeError("tuple or list expected, got %s" % type(data[field]))
            setattr(obj, field, [
                ModelHandler._get_object_by_id_dict(idobj) for idobj in data[field]
            ])
        for action in ("remove", "add"):
            actfield = "%s__%s" % (field, action)
            if actfield in data:
                if not isinstance(data[actfield], (tuple, list)):
                    raise TypeError("tuple or list expected, got %s" % type(data[actfield]))
                m2m = getattr(obj, field)
                for idobj in data[actfield]:
                    obj = ModelHandler._get_object_by_id_dict(idobj)
                    if action == "add":
                        m2m.add(obj)
                    else:
                        m2m.remove(obj)

    def _setobj(self, obj, data):
        """ Update the given object with values from the `data` dict. """
        for field in obj._meta.fields + obj._meta.virtual_fields:
            if field.name in data:
                if isinstance( field, (models.ForeignKey, generic.GenericForeignKey) ):
                    if data[field.name] is not None:
                        setattr(obj, field.name, ModelHandler._get_object_by_id_dict(data[field.name]))
                    else:
                        setattr(obj, field.name, None)
                elif isinstance( field, models.DateTimeField ):
                    if data[field.name] == '':
                        data[field.name] = None
                    setattr(obj, field.name, data[field.name])
                else:
                    setattr(obj, field.name, data[field.name])
        self._override_set(obj, data)
        obj.full_clean()
        obj.save()
        # Forward m2m
        for field in obj._meta.many_to_many:
            self._set_m2m(obj, field.name, data)
        # Reverse m2m
        for rel_m2m in obj._meta.get_all_related_many_to_many_objects():
            self._set_m2m(obj, rel_m2m.get_accessor_name(), data)
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
    backing_handler = property( lambda self: super(ProxyHandler, self) )

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
        # Call every peer
        methods = [(getattr(self._get_proxy_object(peer), method), peer) for peer in self._get_relevant_peers()]
        # Call the backing handler to get local info
        methods.append( (getattr(self.backing_handler, method), None) )
        for meth, peer in methods:
            #print "Trying", peer
            try:
                res = meth(*args)
            except Fault, flt:
                raise translate_exception(flt)
            except (socket.timeout, socket.error, BadStatusLine):
                continue
            if isinstance(res, (tuple, list)):
                ret.extend( self._convert_datetimes( list( res ) ) )
            else:
                ret.append( self._convert_datetimes( res ) )
        return ret

    def _call_singlepeer_method(self, method, id, *args):
        peer  = self._find_target_host(id)
        if peer is None:
            meth = getattr(self.backing_handler, method)
        else:
            meth = getattr(self._get_proxy_object(peer), method)
        try:
            res = meth(id, *args)
        except Fault, flt:
            raise translate_exception(flt)
        return self._convert_datetimes( res )

    def _get_relevant_peers(self):
        return PeerHost.objects.filter( host__in=[ host
            for host in Host.objects.filter(volumegroup__isnull=False).exclude(id=Host.objects.get_current().id).distinct() ] )

    def _find_target_host(self, id):
        raise NotImplementedError("ProxyHandler::_find_target_host needs to be overridden!")



class ProxyModelBaseHandler(ProxyHandler, ModelHandler):

    def _get_model_all_manager(self):
        return self.model.all_objects

    def _find_target_host(self, id):
        if not isinstance( id, dict ):
            id = {'id': int(id)}
        return self._find_target_host_from_model_instance( self._get_model_all_manager().get(**id) )

    def _find_target_host_from_model_instance(self, instance):
        curr = instance
        for field in self.model.objects.hostfilter.split('__'):
            curr = getattr( curr, field )
            if isinstance( curr, Host ):
                break
        if curr == Host.objects.get_current():
            return None
        if curr is None:
            raise RuntimeError("Object is not active on any host")
        return PeerHost.objects.get(host=curr)


class ProxyModelHandler(ProxyModelBaseHandler):
    def _filter(self, kwds, order):
        if "__fields__" in kwds:
            fields = kwds["__fields__"]
            del kwds["__fields__"]
        else:
            fields = None

        db_objects = self._filter_queryset(kwds, self._get_model_all_manager().all())
        result = []
        for instance in db_objects:
            try:
                peer = self._find_target_host_from_model_instance(instance)
            except RuntimeError:
                continue
            if peer is None:
                data = self._getobj(instance)
            else:
                try:
                    data = self._convert_datetimes(self._get_proxy_object(peer).get(instance.id))
                except socket.error, err:
                    if err.errno in (errno.ECONNREFUSED, errno.ECONNABORTED, errno.ECONNRESET,
                            errno.EHOSTUNREACH, errno.ENETUNREACH, errno.ETIMEDOUT) or isinstance(err, socket.timeout):
                        logging.error("Connection to peer %s failed: %s" % (peer.host, err))
                        continue
                    else:
                        raise
                except Fault, flt:
                    continue
            if fields is not None:
                result.append( dict([(key, data[key]) for key in fields]) )
            else:
                result.append( data )

        if order:
            return sorted( result, key=lambda obj: order[0] in obj and obj[order[0]] or None )

        return result

    def _idobj(self, obj):
        return self.backing_handler._idobj(obj)

    def idobj(self, numeric_id):
        """ Get an ID object for the object given by `numeric_id`. """
        return self._idobj( self._get_model_all_manager().get(id=numeric_id) )

    def ids(self):
        """ Get a list of all existing object IDs. """
        return [self._idobj(o) for o in self._get_model_all_manager().all().order_by(*self.order) ]

    def ids_filter(self, kwds):
        """ Get a list of existing object IDs, filtered according to kwds. """
        return [ self._idobj(obj) for obj in self._filter_queryset(kwds, self._get_model_all_manager()).order_by(*self.order) ]

    def all(self):
        """ Return all objects. """
        return self.filter({})

    def filter(self, kwds):
        """ Search for objects with the keywords specified in the kwds dict.

            `kwds` may contain the following special fields:

            * __exclude__: ``**kwargs`` for an :meth:`~django.db.models.query.QuerySet.exclude` call.
            * __fields__: ``*args`` for a :meth:`~django.db.models.query.QuerySet.values` call.

            Any other fields will be passed as ``**kwargs`` to :meth:`~django.db.models.query.QuerySet.filter`.
            See the `Django docs <https://docs.djangoproject.com/en/dev/topics/db/queries/>`_ for details.
        """
        return self._filter(kwds, self.order)

    def get(self, id):
        """ Return an object given by ID. """
        return self._call_singlepeer_method("get", id)

    def get_ext(self, id):
        """ Return an object given by ID.
            Meant to be used in conjunction with ExtJS datastores.
        """
        if id == -1:
            return {}
        return self._call_singlepeer_method("get_ext", id)

    def filter_range(self, start, limit, sort, dir, kwds ):
        """ Return a range of objects ordered by the `sort` field. """
        start = int(start)
        limit = int(limit)
        if dir == "DESC":
            sort = "-" + sort
        objects = self._filter(kwds, sort)
        return {
            "objects": objects[start:(start + limit)],
            "total":   len(objects)
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
        return self._filter(kwds, field)

    def all_values(self, fields):
        """ Return only the fields named in the `fields` list (plus ID).
        """
        return self.backing_handler.all_values(fields)

    def remove(self, id):
        """ Delete an object given by ID. """
        return self._call_singlepeer_method("remove", id)

    def set(self, id, data):
        """ Update the object given by ID with values from the `data` dict. """
        if "id" in data:
            raise KeyError("Wai u ID")
        return self._call_singlepeer_method("set", id, data)

    def create(self, data):
        """ Create a new object with values from the `data` dict. """
        if "id" in data:
            raise KeyError("Wai u ID")
        # Find the peer by walking through the given data
        fields = self.model.objects.hostfilter.split('__')
        target_model = self.model._meta.get_field_by_name(fields[0])[0].related.parent_model
        if target_model == Host:
            curr = Host.objects.get(id=data[fields[0]]["id"])
        else:
            curr = target_model.all_objects.get(id=data[fields[0]]["id"])
            for field in fields[1:]:
                curr = getattr( curr, field )
                if isinstance( curr, Host ):
                    break
        if curr == Host.objects.get_current():
            return self.backing_handler.create(data)
        else:
            peer = PeerHost.objects.get(host=curr)
            try:
                return self._convert_datetimes( self._get_proxy_object(peer).create(data) )
            except Fault, flt:
                raise translate_exception(flt)


def mkModelHandler(model):
    return type(model._meta.object_name + "Handler", (ModelHandler,), {"model": model})

def mkProxyModelHandler(model):
    handler = mkModelHandler(model)
    return type(model._meta.object_name + "Proxy", (ProxyModelHandler, handler), {})
