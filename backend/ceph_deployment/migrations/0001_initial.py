# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import nodb.models


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0002_auto_20161007_1921'),
    ]

    operations = [
        migrations.CreateModel(
            name='CephMinion',
            fields=[
                ('hostname', models.CharField(max_length=250, serialize=False, editable=False, primary_key=True)),
                ('public_address', models.CharField(max_length=100, null=True, editable=False, blank=True)),
                ('public_network', models.CharField(max_length=100, null=True, editable=False, blank=True)),
                ('cluster_network', models.CharField(max_length=100, null=True, editable=False, blank=True)),
                ('key_status', models.CharField(max_length=100, choices=[(b'accepted', b'accepted'), (b'rejected', b'rejected'), (b'denied', b'denied'), (b'pre', b'pre')])),
                ('roles', nodb.models.JsonField(null=True, base_type=list, blank=True)),
                ('storage', nodb.models.JsonField(null=True, base_type=dict, blank=True)),
                ('mon_initial_members', nodb.models.JsonField(null=True, editable=False, base_type=list, blank=True)),
                ('mon_host', nodb.models.JsonField(null=True, editable=False, base_type=list, blank=True)),
                ('cluster', models.ForeignKey(blank=True, to='ceph.CephCluster', null=True)),
            ],
            options={
                'abstract': False,
                'managed': True,
            },
            bases=(models.Model,),
        ),
    ]
