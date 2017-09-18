# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import nodb.models


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0016_cephcluster_osd_flags'),
    ]

    operations = [
        migrations.AddField(
            model_name='cephosd',
            name='cluster',
            field=models.ForeignKey(blank=True, editable=False, to='ceph.CephCluster', null=True),
        ),
        migrations.AlterField(
            model_name='cephosd',
            name='primary_affinity',
            field=models.FloatField(default=0.0),
        ),
    ]
