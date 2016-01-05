# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

from urlparse  import urlparse, ParseResult
from django.db import models
from django.core import exceptions
from django.conf import settings
from django.contrib.auth.models import User

import sysutils.models

from ifconfig.models import Host
from peering.xmlrpctimeout import ServerProxy
from rpcd.models     import APIKey

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
        if not isinstance(value, (ParseResult, PeerURL)):
            return value
        return value.geturl()

class PeerError(Exception):
    pass

class PeerHost(models.Model):
    host         = models.ForeignKey(Host)
    base_url     = PeerUrlField()
    clusterpeer  = models.BooleanField(default=False,
                       help_text="Set to true if I am in a Pacemaker cluster with this peer.")

    def __init__( self, *args, **kwargs ):
        models.Model.__init__( self, *args, **kwargs )
        self._connection = None

    def __unicode__(self):
        return unicode(self.host)

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.id is None:
            if self.clusterpeer and PeerHost.objects.filter(clusterpeer=True).count() > 0:
                raise ValidationError('Another cluster peer already exists.')
        else:
            if self.clusterpeer and PeerHost.objects.filter(clusterpeer=True).exclude(id=self.id).count() > 0:
                raise ValidationError('Another cluster peer already exists.')

    @property
    def connection(self):
        if self._connection is None:
            self._connection = ServerProxy(self.base_url, allow_none=True, timeout=settings.PEER_CONNECT_TIMEOUT)
        return self._connection

    def __getattr__(self, attr):
        if attr == "_host_cache":
            raise AttributeError(attr)
        return getattr( self.connection, attr)


def __install_hostkeys(**kwargs):
    localhost = Host.objects.get_current()
    if PeerHost.objects.filter(host=localhost).count() != 0:
        return
    oauser = User.objects.filter(is_superuser=True)[0]
    key = APIKey(owner=oauser, description=("APIKey for %s" % localhost.name),
                 active=True)
    key.full_clean()
    key.save()
    peer = PeerHost(host=localhost, base_url=("http://__:%s@%s:31234/" % (key.apikey, localhost.name)))
    peer.full_clean()
    peer.save()

sysutils.models.post_install.connect(__install_hostkeys, sender=sysutils.models)
