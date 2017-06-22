# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import nodb.models


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='GaneshaExport',
            fields=[
                ('id', models.CharField(max_length=260, serialize=False, primary_key=True, blank=True)),
                ('exportId', models.IntegerField(blank=True)),
                ('host', models.CharField(max_length=128)),
                ('path', models.TextField()),
                ('pseudo', models.CharField(max_length=250, null=True, blank=True)),
                ('tag', models.CharField(max_length=128, null=True, blank=True)),
                ('accessType', models.CharField(default=b'None', max_length=9, null=True, blank=True, choices=[(b'RW', b'RW'), (b'RO', b'RO'), (b'MDONLY', b'MDONLY'), (b'MDONLY_RO', b'MDONLY_RO'), (b'NONE', b'NONE')])),
                ('squash', models.CharField(default=b'Root', max_length=4, null=True, blank=True, choices=[(b'None', b'None'), (b'Root', b'None'), (b'All', b'All')])),
                ('protocols', nodb.models.JsonField(base_type=list)),
                ('transports', nodb.models.JsonField(base_type=list)),
                ('fsal', models.CharField(blank=True, max_length=4, null=True, choices=[(b'CEPH', b'CEPH'), (b'RGW', b'RGW')])),
                ('rgwUserId', models.CharField(max_length=128, null=True, blank=True)),
                ('clientBlocks', nodb.models.JsonField(null=True, base_type=list, blank=True)),
            ],
            options={
                'abstract': False,
                'managed': True,
            },
        ),
    ]
