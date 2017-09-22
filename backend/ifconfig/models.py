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
    """
    >>> assert get_host_name() != 'localhost'
    """
    fqdn = socket.getfqdn()
    if fqdn != 'localhost':
        return fqdn
    fqdn = socket.gethostname()
    if fqdn != 'localhost':
        return fqdn

    raise ValueError('Unable to determine fully qualified domain name (FQDN) or host name. Please '
                     'check your host name configuration before proceeding with the installation.')
