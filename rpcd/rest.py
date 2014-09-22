# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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

import json

from django.conf    import settings
from django.core.serializers.json import DjangoJSONEncoder
from rest_framework import viewsets, routers
from rest_framework.response import Response

from rpcd.handlers import ModelHandler

class ModelHandlerViewSet(viewsets.ViewSet):
    backing_handler = None

    def _call_backing_handler(self, request, method, *args, **kwargs):
        inst = self.backing_handler(request.user, request)
        meth = getattr(inst, method)
        result = meth(*args, **kwargs)
        return Response(result)

    def create(self, request, *args, **kwargs):
        return self._call_backing_handler(request, "create", request.DATA)

    def list(self, request, *args, **kwargs):
        params = request.QUERY_PARAMS.dict()
        if "format" in params:
            del params["format"]
        return self._call_backing_handler(request, "filter", params)

    def retrieve(self, request, *args, **kwargs):
        return self._call_backing_handler(request, "get", kwargs["pk"])

    def update(self, request, *args, **kwargs):
        return self._call_backing_handler(request, "set", kwargs["pk"], request.DATA)

    def destroy(self, request, *args, **kwargs):
        return self._call_backing_handler(request, "remove", kwargs["pk"])


def get_router():
    rpcdplugins = []

    for app in settings.INSTALLED_APPS:
        try:
            module = __import__( app+".rpcapi" )
        except ImportError, err:
            if unicode(err) != "No module named rpcapi":
                logging.error("Got error when checking app %s: %s", app, unicode(err))
        else:
            rpcdplugins.append(module)

    router = routers.DefaultRouter()

    for plugin in rpcdplugins:
        for handler in getattr(getattr(plugin, "rpcapi"), "RPCD_HANDLERS", []):
            if not issubclass(handler, ModelHandler):
                continue
            router.register(handler.handler_name.replace('.', '/'), type(
                str(handler.handler_name.replace('.', '') + "HandlerViewSet"),
                (ModelHandlerViewSet, ),
                {"backing_handler": handler,
                 "model": handler.model}
                ))

    return router


ROUTER = get_router()

