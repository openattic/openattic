# -*- coding: utf-8 -*-

from django.conf import settings

XINETD_CONF = getattr( settings, "TFTP_XINETD_CONF", "/etc/xinetd.d/openattic-tftp" )
