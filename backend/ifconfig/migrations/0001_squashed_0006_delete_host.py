# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    replaces = [
        (b'ifconfig', '0001_initial'),
        (b'ifconfig', '0002_auto_20160329_1248'),
        (b'ifconfig', '0004_fix_current_host_localhost'),
        (b'ifconfig', '0003_host_is_oa_host'),
        (b'ifconfig', '0005_remove_hostgroup_ipaddress_netdevice'),
        (b'ifconfig', '0006_delete_host')]

    dependencies = [
#        ('userprefs', '0002_remove_userprofile_host'),
#        ('cmdlog', '0002_remove_logentry'),
#        ('volumes', '0002_remove'),
    ]

    operations = [
    ]
