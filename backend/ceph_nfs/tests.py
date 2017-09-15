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
from django.core.exceptions import ValidationError
from django.test import TestCase

from ceph_nfs.models import GaneshaExport


class GaneshaExportTestCase(TestCase):
    def test_validate(self):
        GaneshaExport(
            fsal='RGW',
            path='foobar',
            protocols=['NFSv4'],
            transports=['TCP'],
            rgwUserId='jup',
            pseudo='/pseudo',
            tag='tag'
        )._validate([], None)

        with self.assertRaises(ValidationError) as context:
            GaneshaExport(
                fsal='RGW',
                path='foobar',
                protocols=['NFSv4'],
                transports=['TCP'],
                rgwUserId='jup',
                pseudo='pseudo',
                tag='tag'
            )._validate([], None)
        self.assertIn('pseudo', str(context.exception))
