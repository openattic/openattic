# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0013_cephcluster_add_keyring'),
    ]

    operations = [
        migrations.AddField(
            model_name='cephrbd',
            name='data_pool',
            field=models.ForeignKey(related_name='data_pool', blank=True, to='ceph.CephPool', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephrbd',
            name='pool',
            field=models.ForeignKey(related_name='pool', to='ceph.CephPool'),
            preserve_default=True,
        ),
    ]
