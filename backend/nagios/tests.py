# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
This file demonstrates writing tests using the unittest module. These will pass
when you run "manage.py test".

Replace this with more appropriate tests for your application.
"""

from __future__ import division

from django.test import TestCase

from nagios.graphbuilder import (rgbstr_to_rgb_int, rgbstr_to_rgb, get_hls_complementary,
                                 hls_to_rgbstr, get_gradient_args)


class SimpleTest(TestCase):
    def test_rgbstr_to_rgb_int(self):
        self.assertEqual(rgbstr_to_rgb_int("223344"), (0x22, 0x33, 0x44))

    def test_rgbstr_to_rgb(self):
        self.assertEqual(rgbstr_to_rgb("223344"), (0x22/0xFF, 0x33/0xFF, 0x44/0xFF))

    def test_complementary(self):
        self.assertEqual(get_hls_complementary((0.3, 0.2, 0.5)), (0.8, 0.8, 0.5))
        self.assertEqual(get_hls_complementary(get_hls_complementary((0.8, 0.8, 0.5))),
                         (0.8, 0.8, 0.5))

    def test_gradient(self):
        self.assertEqual(
            get_gradient_args("test", (0.2, 0.2, 0.5), (0.8, 0.8, 0.5), 5),
            [
                'CDEF:testgrd5=test,1.00,*',
                'AREA:testgrd5#424C19FF',
                'CDEF:testgrd4=test,0.80,*',
                'AREA:testgrd4#4A551CFF',
                'CDEF:testgrd3=test,0.60,*',
                'AREA:testgrd3#627125FF',
                'CDEF:testgrd2=test,0.40,*',
                'AREA:testgrd2#899F35FF',
                'CDEF:testgrd1=test,0.20,*',
                'AREA:testgrd1#B4C95FFF'
            ])

    def test_hls_to_rgbstr(self):
        self.assertEqual(hls_to_rgbstr((0.8, 0.8, 0.5)), 'DBB2E5')
