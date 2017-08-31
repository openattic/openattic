# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ifconfig', '0004_fix_current_host_localhost'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='hostgroup',
            name='hosts',
        ),
        migrations.RemoveField(
            model_name='ipaddress',
            name='device',
        ),
        migrations.AlterUniqueTogether(
            name='netdevice',
            unique_together=set([]),
        ),
        migrations.RemoveField(
            model_name='netdevice',
            name='brports',
        ),
        migrations.RemoveField(
            model_name='netdevice',
            name='host',
        ),
        migrations.RemoveField(
            model_name='netdevice',
            name='slaves',
        ),
        migrations.RemoveField(
            model_name='netdevice',
            name='vlanrawdev',
        ),
        migrations.DeleteModel(
            name='HostGroup',
        ),
        migrations.DeleteModel(
            name='IPAddress',
        ),
        migrations.DeleteModel(
            name='NetDevice',
        ),
    ]
