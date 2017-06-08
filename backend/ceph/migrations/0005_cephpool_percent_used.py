# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0004_rm_models_based_on_storageobj'),
    ]

    operations = [
        migrations.AddField(
            model_name='cephpool',
            name='percent_used',
            field=models.FloatField(default=None, editable=False, blank=True),
            preserve_default=True,
        ),
    ]
