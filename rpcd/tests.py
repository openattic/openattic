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

from SimpleXMLRPCServer import list_public_methods

import unittest
import logging
from django.conf  import settings

def makeTest():
    rpcdplugins = []
    for app in settings.INSTALLED_APPS:
        try:
            module = __import__( app+".rpcapi" )
        except ImportError, err:
            if unicode(err) != "No module named rpcapi":
                logging.error("Got error when checking app %s: %s", app, unicode(err))
        else:
            rpcdplugins.append(module)

    class DocStringTestCase(unittest.TestCase):
        pass

    def makeTestmethod(method):
        def testMethod(self):
            self.assertTrue(method.__doc__ is not None)
        return testMethod

    for app in rpcdplugins:
        if not hasattr(app.rpcapi, "RPCD_HANDLERS"):
            logging.error("App %s has an API but does not export any handlers!?" % app)
            continue
        for handler in app.rpcapi.RPCD_HANDLERS:
            hname = handler.handler_name.replace(".", "__")
            for method in list_public_methods(handler):
                fullname = "test_%s__%s" % ( hname, method )
                meth = makeTestmethod(getattr(handler, method))
                meth.__name__ = str(fullname)
                setattr(DocStringTestCase, fullname, meth)

    return DocStringTestCase

RpcdDocStringTestCase = makeTest()
