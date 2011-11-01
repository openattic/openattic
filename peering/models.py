# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import socket

from urlparse  import urlparse, ParseResult
from xmlrpclib import ServerProxy
from django.db import models
from django.core import exceptions


class PeerURL(unicode):
    def set_result(self, result):
        self._result = result

    def __getattr__(self, attr):
        return getattr(self._result, attr)


class PeerUrlField(models.CharField):
    __metaclass__ = models.SubfieldBase

    def __init__(self, *args, **kwargs):
        kwargs["max_length"] = 250
        super(PeerUrlField, self).__init__(*args, **kwargs)

    def validate(self, value, instance):
        if isinstance(value, (ParseResult, PeerURL)):
            value = value.geturl()
        sp = ServerProxy(value)
        try:
            sp.ping()
        except Exception, e:
            raise exceptions.ValidationError(unicode(e))

    def to_python(self, value):
        if isinstance(value, (ParseResult, PeerURL)):
            return value
        pu = PeerURL(value)
        pu.set_result( urlparse(value) )
        return pu

    def get_db_prep_value( self, value, connection=None, prepared=False ):
        if prepared or not isinstance(value, (ParseResult, PeerURL)):
            return value
        return value.geturl()


class PeerHost(models.Model):
    name         = models.CharField(max_length=250)
    base_url     = PeerUrlField()
    clusterpeer  = models.BooleanField(default=False,
                       help_text="Set to true if I am in a Pacemaker cluster with this peer.")

    def __init__( self, *args, **kwargs ):
        models.Model.__init__( self, *args, **kwargs )
        self._connection = None

    def __unicode__(self):
        return self.name

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.id is None:
            if self.clusterpeer and PeerHost.objects.filter(clusterpeer=True).count() > 0:
                raise ValidationError('Another cluster peer already exists.')
        else:
            if self.clusterpeer and PeerHost.objects.filter(clusterpeer=True).exclude(id=self.id).count() > 0:
                raise ValidationError('Another cluster peer already exists.')

    @property
    def duplex(self):
        try:
            self.connection.ping()
        except:
            return "none"
        else:
            try:
                self.connection.peering.PeerHost.ping(self.thishost["id"])
            except:
                return "half"
            else:
                return "full"

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
