# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from SimpleXMLRPCServer import list_public_methods

import unittest
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
        for handler in app.rpcapi.RPCD_HANDLERS:
            hname = handler._get_handler_name().replace(".", "__")
            for method in list_public_methods(handler):
                fullname = "test_%s__%s" % ( hname, method )
                meth = makeTestmethod(getattr(handler, method))
                meth.__name__ = fullname
                setattr(DocStringTestCase, fullname, meth)

    return DocStringTestCase

RpcdDocStringTestCase = makeTest()
