# -*- coding: utf-8 -*-

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
from rest_framework.pagination import PageNumberPagination

from rest.utilities import drf_version

assert drf_version() >= (3, 0)


class PageSizePageNumberPagination(PageNumberPagination):
    """
    This class must be declared in a module without any reference to any Views, otherwise
    you get a circular import.
    """
    page_size_query_param = "pageSize"
