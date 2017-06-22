# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0005_cephpool_percent_used'),
    ]

    operations = [
        migrations.AddField(
            model_name='cephosd',
            name='osd_objectstore',
            field=models.CharField(max_length=15, null=True, editable=False),
            preserve_default=True,
        ),
    ]
