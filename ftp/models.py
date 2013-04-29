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

import dbus

from os.path import join, exists
from os import makedirs

from django.db import models
from django.conf import settings

from ftp.conf import settings as ftp_settings
from ifconfig.models import getHostDependentManagerClass
from django.contrib.auth.models import User
from lvm.models import LogicalVolume
import lvm.signals as lvm_signals


class FileLog(models.Model):
    username    = models.ForeignKey( User, to_field="username" )
    abspath     = models.CharField( max_length=500 )
    file        = models.CharField( max_length=500 )
    dns         = models.CharField( max_length=500 )
    transtime   = models.CharField( max_length=500 )
    rectime     = models.DateTimeField()
