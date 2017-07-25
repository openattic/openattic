# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import django.core.validators
from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0011_cephrbd_features_default'),
    ]

    operations = [
        migrations.AddField(
            model_name='cephpool',
            name='compression_algorithm',
            field=models.CharField(default=b'none', max_length=100, choices=[(b'none', b'none'), (b'snappy', b'snappy'), (b'zlib', b'zlib'), (b'zstd', b'zstd'), (b'lz4', b'lz4')]),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='cephpool',
            name='compression_max_blob_size',
            field=models.IntegerField(default=0),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='cephpool',
            name='compression_min_blob_size',
            field=models.IntegerField(default=0),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='cephpool',
            name='compression_mode',
            field=models.CharField(default=b'none', max_length=100, choices=[(b'force', b'force'), (b'aggressive', b'aggressive'), (b'passive', b'passive'), (b'none', b'none')]),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='cephpool',
            name='compression_required_ratio',
            field=models.FloatField(default=0.0, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(1)]),
            preserve_default=True,
        ),
    ]
