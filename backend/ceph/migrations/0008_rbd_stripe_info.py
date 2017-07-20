# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import nodb.models


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0007_cephpool_flags_editable'),
    ]

    operations = [
        migrations.AddField(
            model_name='cephrbd',
            name='stripe_count',
            field=models.IntegerField(null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='cephrbd',
            name='stripe_unit',
            field=models.IntegerField(null=True, blank=True),
            preserve_default=True,
        ),
    ]
