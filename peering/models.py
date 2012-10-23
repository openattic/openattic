# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
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

import socket

from urlparse  import urlparse, ParseResult
from django.db import models
from django.core import exceptions
from django.conf import settings

from rpcd.signals import post_mastersync

from peering.xmlrpctimeout import ServerProxy

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
        sp = ServerProxy(value, timeout=settings.PEER_CONNECT_TIMEOUT)
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


class PeerError(Exception):
    pass

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
            self._connection = ServerProxy(self.base_url, allow_none=True, timeout=settings.PEER_CONNECT_TIMEOUT)
        return self._connection

    @property
    def thishost(self):
        found = self.connection.peering.PeerHost.filter({'name': socket.gethostname()})
        if len(found) == 1:
            return found[0]
        raise self.DoesNotExist("No host named %s found on peer %s." % ( socket.gethostname(), self.name ))

    def __getattr__(self, attr):
        return getattr( self.connection, attr)


def sync_peers(**kwargs):
    for data in kwargs["serv"].peering.PeerHost.all():
        try:
            PeerHost.objects.get(id=int(data["id"]))
        except PeerHost.DoesNotExist:
            kk = PeerHost(name=data["name"], base_url=data["base_url"])
            kk.save()


post_mastersync.connect(sync_peers)

