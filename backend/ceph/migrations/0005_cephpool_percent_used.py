# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0003_allow_blanks_in_cephpool'),
    ]

    operations = [
        migrations.AddField(
            model_name='cephpool',
            name='percent_used',
            field=models.FloatField(default=None, editable=False, blank=True),
            preserve_default=True,
        ),
    ]
