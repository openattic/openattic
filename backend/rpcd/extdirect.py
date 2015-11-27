# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2015, it-novum GmbH <community@openattic.org>
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

import socket
import inspect
import logging
from functools import wraps

from django.conf import settings

from djextdirect.provider import Provider as BaseProvider, getname

from rpcd.handlers import ModelHandler

class MainHandler(object):
    def __init__(self, user, request=None):
        self.user = user
        self.request = request

    def get_installed_apps(self):
        """ Return a list of installed Django apps. """
        return settings.INSTALLED_APPS

    def ping(self):
        """ Noop to test the XMLRPC connection. """
        return "pong %s" % self.user.username

    def hostname(self):
        """ Get this host's hostname. """
        return socket.gethostname()

    def fqdn(self):
        """ Get this host's fully qualified domain name (FQDN). """
        return socket.getfqdn()

    def get_loaded_modules(self):
        """ Return a list of loaded handler modules. """
        res = []
        for hname in self.provider.handlers.keys():
            if hname == '__main__':
                continue
            app = hname.split('__')[0]
            if app not in res:
                res.append(app)
        return res

    def get_object(self, idobj):
        """ Return an object resolved from an ID dictionary.

            Ext.Direct splits up the dict, that's why we need three distinct args here.
        """
        obj = ModelHandler._get_object_by_id_dict(idobj)
        handler = ModelHandler._get_handler_for_model(obj.__class__)(None)
        return handler._getobj(obj)

    def get_related(self, idobj):
        """ Return objects that reference the object given by the ID dictionary.

            Ext.Direct splits up the dict, that's why we need three distinct args here.
        """
        obj = ModelHandler._get_object_by_id_dict(idobj)
        relids = []
        for relobj in ( obj._meta.get_all_related_objects() + obj._meta.get_all_related_many_to_many_objects() ):
            relids.extend([
                ModelHandler._get_handler_for_model(relobj.model)(None)._idobj(relmdl)
                for relmdl in relobj.model.objects.filter( **{ relobj.field.name: obj } )
                ])
        return relids


class Provider(BaseProvider):
    """ Ext.Direct provider class that inherits from DjExtDirect's provider.

        Upon instantiation, the class expects a dict of handler classes
        to be passed in. Those handlers will then be registered with the
        Provider to make up the API.
    """

    def __init__( self, handlers, name="Ext.app.REMOTING_API", autoadd=True ):
        self.handlers = handlers
        self.handlers["__main__"] = MainHandler
        MainHandler.provider = self

        BaseProvider.__init__( self, name, autoadd )
        for action in handlers:
            self.classes[action] = {}
            for attrname in dir(handlers[action]):
                if attrname.startswith('_'):
                    continue
                attrval = getattr( handlers[action], attrname )
                if inspect.ismethod(attrval):
                    self._register_method(action, attrval, getattr(attrval, "EXT_flags", None))

    def _make_call_wrapper(self, func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated():
                raise Exception("Access Denied!")
            # func is an UNBOUND class method. Get the handler class,
            # instantiate it with the current user, and...
            hh = func.im_class(request.user, request)
            # call the BOUND method from that instance.
            return getattr(hh, func.__name__)(*args, **kwargs)
        return wrapper

    def _register_method( self, cls_or_name, method, flags=None ):
        """ Actually registers the given function as a method of cls_or_name. """
        clsname = getname(cls_or_name)
        if clsname not in self.classes:
            self.classes[clsname] = {}
        if flags is None:
            flags = {}
        # Since we don't want the request to be passed through to the handler,
        # we need to create a wrapper around it that strips away the first argument.
        wrapper = self._make_call_wrapper( method )
        self.classes[ clsname ][ method.__name__ ] = wrapper
        wrapper.EXT_argnames = inspect.getargspec( method )[0][1:]
        wrapper.EXT_len      = len( wrapper.EXT_argnames )
        wrapper.EXT_flags    = flags
        return method


def get_provider():
    rpcdplugins = []

    for app in settings.INSTALLED_APPS:
        try:
            module = __import__( app+".rpcapi" )
        except ImportError, err:
            if unicode(err) != "No module named rpcapi":
                logging.error("Got error when checking app %s: %s", app, unicode(err))
        else:
            rpcdplugins.append(module)

    handlers = {}

    for plugin in rpcdplugins:
        for handler in getattr(getattr(plugin, "rpcapi"), "RPCD_HANDLERS", []):
            handlers[ handler.handler_name.replace('.', '__') ] = handler

    return Provider(handlers, autoadd=True)


PROVIDER = get_provider()
