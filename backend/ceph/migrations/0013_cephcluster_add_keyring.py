# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0012_cephpool_compression'),
    ]

    operations = [
        migrations.AddField(
            model_name='cephcluster',
            name='config_file_path',
            field=models.CharField(max_length=1024, null=True, editable=False),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='cephcluster',
            name='keyring_file_path',
            field=models.CharField(max_length=1024, null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='cephcluster',
            name='keyring_user',
            field=models.CharField(max_length=1024, null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephcluster',
            name='fsid',
            field=models.CharField(max_length=36, serialize=False, editable=False, primary_key=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephcluster',
            name='health',
            field=models.CharField(max_length=11, editable=False),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephcluster',
            name='name',
            field=models.CharField(max_length=100, editable=False),
            preserve_default=True,
        ),
    ]
