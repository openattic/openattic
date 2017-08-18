# -*- coding: utf-8 -*-

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

import socket
import logging

from django.conf import settings
from django.db import models

logger = logging.getLogger(__name__)


def get_host_name():
    fqdn = socket.getfqdn()
    if fqdn != 'localhost':
        return fqdn
    fqdn = socket.gethostname()
    if fqdn != 'localhost':
        return fqdn

    raise ValueError('Unable to determine fully qualified domain name (FQDN) or host name. Please '
                     'check your host name configuration before proceeding with the installation.')


class HostManager(models.Manager):
    def __init__(self, *args, **kwargs):
        logger.info('Current Version: {}'.format(settings.VERSION_CONF['package']['VERSION']))
        super(HostManager, self).__init__(*args, **kwargs)

    def get_current(self):
        try:
            return self.get(name=get_host_name())
        except Host.DoesNotExist:
            host = Host(name=get_host_name(), is_oa_host=True)
            host.save()
            return host


class Host(models.Model):
    name = models.CharField(max_length=63, unique=True)
    is_oa_host = models.NullBooleanField()

    objects = HostManager()

    def __unicode__(self):
        return self.name

    @property
    def hostname(self):
        return self.name.split('.')[0]

    @property
    def installed_apps(self):
        if self.is_oa_host:
            return settings.INSTALLED_APPS

    @property
    def oa_version(self):
        if self.is_oa_host:
            return settings.VERSION_CONF
