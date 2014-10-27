import logging

from django.conf import settings
from rest_framework.routers import DefaultRouter

def get_router():
    logging.info("Detecting modules...")
    rpcdplugins = []
    for app in settings.INSTALLED_APPS:
        try:
            module = __import__( app+".restapi" )
        except ImportError, err:
            if unicode(err) != "No module named restapi":
                logging.error("Got error when checking app %s: %s", app, unicode(err))
        else:
            rpcdplugins.append(module)
    logging.info( "Loaded modules: %s", ', '.join([module.__name__ for module in rpcdplugins]) )

    router = DefaultRouter()

    for plugin in rpcdplugins:
        for (name, handler) in getattr(getattr(plugin, "restapi"), "RESTAPI_VIEWSETS", []):
            router.register(name, handler)

    return router

ROUTER = get_router()
