# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

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

    def __getattr__(self, attr):
        return getattr( self.connection, attr)
