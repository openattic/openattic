# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ifconfig', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='netdevice',
            name='devname',
            field=models.CharField(max_length=15),
            preserve_default=True,
        ),
    ]
