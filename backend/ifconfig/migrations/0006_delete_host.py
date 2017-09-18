# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userprefs', '0002_remove_userprofile_host'),
        ('cmdlog', '0002_remove_logentry'),
        ('ifconfig', '0005_remove_hostgroup_ipaddress_netdevice'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Host',
        ),
    ]
