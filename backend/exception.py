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
import logging
from errno import errorcode

import django
from django.core.exceptions import ValidationError

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


def custom_handler(exc, context=None):
    """
    :type exc: Exception
    :type context: dict
    """
    # Call the default exception handler of the Django REST framework
    if django.VERSION[:2] >= (1, 8):
        response = exception_handler(exc, context)
    else:
        response = exception_handler(exc)

    if response:
        return response

    # If the default handler can't find a suitable exception response try the custom ones.
    # Note, HTTP 400 errors should be used when a functionality does not exist for the called
    # object, e.g. a file system does not support shrinking or growing. Internal backend issues,
    # e.g. where the user is not responsible for, must use the HTTP 500 error.

    if isinstance(exc, ValidationError):
        if logger.level <= logging.DEBUG:
            logger.exception('Validation Error')
        # By default the ValidationError exception should be called with a Python dictionary
        # containing the error messages for each erroneous field.
        if hasattr(exc, 'error_dict'):
            # An error dictionary must be handled different, otherwise the origin error message(s)
            # will not be processed correct by the Django framework and will finally not submitted
            # to the API caller as response content.
            return Response(exc.message_dict, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(exc, 'error_list'):
            errors = exc.messages
            if len(errors) == 1:
                return Response({'detail': errors[0]}, status=status.HTTP_400_BAD_REQUEST)
            if len(errors) > 1:
                return Response({'detail': errors}, status=status.HTTP_400_BAD_REQUEST)

        # Handle exceptions that are raised with an single error message string.
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    if isinstance(exc, NotSupportedError):
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    logger.exception('Internal Server Error: {}'.format(context))

    if exc is not None:
        return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # If there is no suitable exception at all just return nothing to generate a '500 - Internal
    # Server Error' exception


def validate_input_fields(input_data, expected_fields):
    missing_fields = {}

    for field in expected_fields:
        if field not in input_data:
            missing_fields[field] = ["This field is required"]

    if len(missing_fields) > 0:
        raise ValidationError(missing_fields)


class NotSupportedError(Exception):
    def __init__(self, *args, **kwargs):
        super(NotSupportedError, self).__init__(*args, **kwargs)


class ExternalCommandError(Exception):
    def __init__(self, err, cmd=None, argdict=None, code=None):
        self.code = abs(code) if code is not None else None
        code_string = errorcode.get(self.code, str(self.code))
        argdict = argdict if isinstance(argdict, dict) else {}
        if cmd is None and self.code is None:
            s = err
        elif cmd is None:
            s = 'error={} code={}'.format(err, code_string)
        else:
            cmd = cmd['prefix'] if isinstance(cmd, dict) and 'prefix' in cmd else cmd
            s = 'Executing "{} {}" failed: "{}" code={}'.format(cmd, ' '.join(
                ['{}={}'.format(k, v) for k, v in argdict.items()]), err, code_string)
        super(ExternalCommandError, self).__init__(s)
