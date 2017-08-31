# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import nodb.models


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0014_cephrbd_data_pool'),
    ]

    operations = [
        migrations.AddField(
            model_name='cephpool',
            name='application_metadata',
            field=nodb.models.JsonField(default={}, base_type=dict, blank=True),
        ),
    ]
