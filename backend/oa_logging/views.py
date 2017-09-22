# -*- coding: utf-8 -*-
"""
 *   Copyright (c) 2017 SUSE LLC
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

from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)


class JSExceptionView(APIView):
    def post(self, request):
        logger.error('Error from client ({}): {}\n  {}\n  {}'.format(
            request.DATA.get('url', ''),
            request.DATA.get('errorMessage', ''),
            request.DATA.get('errorStack', ''),
            request.DATA.get('errorCause', '')))
        return Response()
