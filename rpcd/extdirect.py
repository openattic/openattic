# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import socket
import inspect
import logging
from functools import wraps

from django.conf import settings
from django.contrib.auth.models import User

from djextdirect.provider import Provider as BaseProvider, getname

class MainHandler(object):
    def __init__(self, user):
        self.user = user

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
            name = handler._get_handler_name()
            handlers[ name.replace('.', '__') ] = handler

    return Provider(handlers, autoadd=True)


PROVIDER = get_provider()
