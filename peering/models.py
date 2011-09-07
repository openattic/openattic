# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import socket

from urlparse  import urlparse
from xmlrpclib import ServerProxy
from django.db import models

class PeerHost(models.Model):
    name         = models.CharField(max_length=250)
    base_url     = models.CharField(max_length=250)
    clusterpeer  = models.BooleanField(default=False,
                       help_text="Set to true if I am in a Pacemaker cluster with this peer.")

    def __init__( self, *args, **kwargs ):
        models.Model.__init__( self, *args, **kwargs )
        self._connection = None
        self._parsed_url = None

    def __unicode__(self):
        return self.name

    @property
    def parsed_url(self):
        if self._parsed_url is None and self.base_url:
            self._parsed_url = urlparse(self.base_url)
        return self._parsed_url

    @property
    def username(self):
        if not self.base_url:
            return None
        return self.parsed_url.username

    @property
    def password(self):
        if not self.base_url:
            return None
        return self.parsed_url.password

    @property
    def hostname(self):
        if not self.base_url:
            return None
        return self.parsed_url.hostname

    @property
    def port(self):
        if not self.base_url:
            return None
        return self.parsed_url.port

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
