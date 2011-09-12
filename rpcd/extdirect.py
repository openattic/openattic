# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import inspect
import logging
from functools import wraps

from django.conf import settings

from djextdirect.provider import Provider as BaseProvider, getname

from rpcd.handlers import MainHandler

class Provider(BaseProvider):
    """ Ext.Direct provider class that inherits from DjExtDirect's provider.

        Upon instantiation, the class expects a dict of handler classes
        to be passed in. Those handlers will then be registered with the
        Provider to make up the API.
    """

    def __init__( self, handlers, name="Ext.app.REMOTING_API", autoadd=True ):
        self.handlers = handlers
        self.handlers["__main__"] = MainHandler(self, '__')
        BaseProvider.__init__( self, name, autoadd )
        for action in handlers:
            self.classes[action] = {}
            for attrname in dir(handlers[action]):
                if attrname.startswith('_'):
                    continue
                attrval = getattr( handlers[action], attrname )
                if inspect.ismethod(attrval):
                    self._register_method(action, attrval)

    def _make_call_wrapper(self, func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_authenticated():
                raise Exception("Access Denied!")
            return func(*args, **kwargs)
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
            meta = handler.model._meta
            handlers[ meta.app_label+'__'+meta.object_name ] = handler()

    return Provider(handlers, autoadd=True)


PROVIDER = get_provider()
