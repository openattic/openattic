# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *   Copyright (c) 2016 SUSE LLC
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
import sys
from utilities import is_executable_installed

try:
    import ceph
except ImportError:
    print >>sys.stderr, 'Cannot import app "ceph", disabling app "ceph_deployment"'
    raise ImportError()

if not is_executable_installed('salt'):
    print >>sys.stderr, '"salt" executable not found, disabling app "ceph_deployment"'
    raise ImportError()
