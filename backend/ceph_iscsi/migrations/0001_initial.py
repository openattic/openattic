# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import nodb.models


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='iSCSIInterface',
            fields=[
                ('hostname', models.CharField(max_length=250, serialize=False, editable=False, primary_key=True)),
                ('interfaces', nodb.models.JsonField(null=True, editable=False, base_type=list, blank=True)),
            ],
            options={
                'abstract': False,
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='iSCSITarget',
            fields=[
                ('targetId', models.CharField(max_length=120, serialize=False, primary_key=True)),
                ('newTargetId', models.CharField(max_length=120, null=True, blank=True)),
                ('targetSettings', nodb.models.JsonField(null=True, base_type=object, blank=True)),
                ('portals', nodb.models.JsonField(base_type=list)),
                ('images', nodb.models.JsonField(base_type=list)),
                ('authentication', nodb.models.JsonField(null=True, base_type=object, blank=True)),
            ],
            options={
                'abstract': False,
                'managed': True,
            },
        ),
    ]
