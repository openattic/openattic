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

from django.core.exceptions import ValidationError

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_handler(exc):
    # Call the default exception handler of the Django REST framework
    response = exception_handler(exc)

    if response:
        return response

    # If the default handler can't find a suitable exception response try the custom ones
    if isinstance(exc, ValidationError):
        return Response(exc, status=status.HTTP_400_BAD_REQUEST)

    if isinstance(exc, NotSupportedError):
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    # If there is no suitable exception at all just return nothing to generate a '500 - Internal
    # Server Error' exception


class NotSupportedError(Exception):
    def __init__(self, *args, **kwargs):
        super(NotSupportedError, self).__init__(*args, **kwargs)
