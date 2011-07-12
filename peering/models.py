# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import socket

from xmlrpclib import ServerProxy
from django.db import models

class PeerHost(models.Model):
    name         = models.CharField(max_length=250)
    base_url     = models.CharField(max_length=250)
    username     = models.CharField(max_length=50)
    password     = models.CharField(max_length=50)

    def __init__( self, *args, **kwargs ):
        models.Model.__init__( self, *args, **kwargs )
        self._connection = None

    def __unicode__(self):
        return self.name

    @property
    def connection(self):
        if self._connection is None:
            self._connection = ServerProxy(self.base_url, allow_none=True)
        return self._connection

    @property
    def thishost(self):
        found = self.connection.peering.PeerHost.filter({'name': socket.gethostname()})
        if len(found) == 1:
            return found[0]
        raise self.DoesNotExist("No host named %s found on peer %s." % ( socket.gethostname(), self.name ))

    def __getattr__(self, attr):
        return getattr( self.connection, attr)
