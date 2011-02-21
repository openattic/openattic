# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.conf.urls.defaults import url, patterns, include
from django.conf import settings

from piston.resource import Resource
from piston.handler import BaseHandler, AnonymousBaseHandler
from piston.authentication import HttpBasicAuthentication
from piston.doc import documentation_view

auth = HttpBasicAuthentication(realm="pyFiler API")

urlpatterns = []

for app in settings.INSTALLED_APPS:
    try:
        module = __import__( app+".api" )
        handlers = getattr( getattr( module, "api"), "api_handlers" )
    except (ImportError, AttributeError):
        pass
    else:
        for handler in handlers:
            if len(handler) > 2:
                pattern, instance, urlname = handler
            else:
                pattern, instance = handler
                urlname = None
            
            resource = Resource(handler=instance, authentication=auth)
            
            if isinstance( pattern, (tuple, list) ):
                for pat in pattern:
                    urlpatterns.append(url(pat, resource, name=urlname))
                    urlname = None
            else:
                urlpatterns.append(url(pattern, resource, name=urlname))

urlpatterns.append(url(r'$', documentation_view))
