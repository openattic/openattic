# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0009_cephpool_flags_default'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='cephcluster',
            name='performance_data_options',
        ),
    ]
