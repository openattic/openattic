# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2015, it-novum GmbH <community@openattic.org>
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

import re
import exceptions

from ast import literal_eval

from django.core.exceptions import ValidationError
from xmlrpclib import Fault

def translate_exception(rpcfault):
    """ Examines an XMLRPClib `Fault' instance and returns the "real" exception wrapped in it.

        In case this translation fails or this is not an xmlrpclib.Fault instance,
        the original exception will be returned as-is.
    """
    if not isinstance(rpcfault, Fault):
        return rpcfault

    # faultString is always:
    # <class|type '$class'>:reason

    m = re.match( r"""<(class|type) '(?P<exctype>[a-zA-Z.]+)'>:(?P<reason>.*)""", rpcfault.faultString )
    if not m:
        return rpcfault

    if m.group('exctype') == "django.core.exceptions.ValidationError":
        err = ValidationError("")
        # Reason is a repr() of a dict containing lists of messages.
        err.message_dict = literal_eval( m.group("reason") )
        return err

    module, classname = m.group('exctype').rsplit(".", 1)
    if module == "exceptions":
        # reason is a "string", so we need to strip away the "".
        return getattr(exceptions, classname)(m.group("reason")[1:-1])

    return rpcfault
