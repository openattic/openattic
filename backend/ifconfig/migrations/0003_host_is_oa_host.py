# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ifconfig', '0002_auto_20160329_1248'),
    ]

    operations = [
        migrations.AddField(
            model_name='host',
            name='is_oa_host',
            field=models.NullBooleanField(),
            preserve_default=True,
        ),
    ]
