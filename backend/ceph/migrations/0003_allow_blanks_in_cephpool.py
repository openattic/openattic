# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import nodb.models
from nodb.models import AlterNoDBField


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0002_auto_20161007_1921'),
    ]

    run_before = [
        ('volumes', '0002_remove'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cephpool',
            name='cache_mode',
            field=models.CharField(blank=True, max_length=100, choices=[(b'none', b'none'), (b'writeback', b'writeback'), (b'forward', b'forward'), (b'readonly', b'readonly'), (b'readforward', b'readforward'), (b'readproxy', b'readproxy')]),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='crash_replay_interval',
            field=models.IntegerField(blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='crush_ruleset',
            field=models.IntegerField(blank=True),
            preserve_default=True,
        ),
        AlterNoDBField(
            model_name='cephpool',
            name='flags',
            field=nodb.models.JsonField(base_type=list, editable=False, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='hit_set_count',
            field=models.IntegerField(blank=True),
            preserve_default=True,
        ),
        AlterNoDBField(
            model_name='cephpool',
            name='hit_set_params',
            field=nodb.models.JsonField(base_type=dict, editable=False, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='hit_set_period',
            field=models.IntegerField(blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='kb_used',
            field=models.IntegerField(editable=False, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='last_change',
            field=models.IntegerField(editable=False, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='max_avail',
            field=models.IntegerField(editable=False, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='num_bytes',
            field=models.IntegerField(editable=False, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='num_objects',
            field=models.IntegerField(editable=False, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='pg_num',
            field=models.IntegerField(blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='pgp_num',
            field=models.IntegerField(editable=False, blank=True),
            preserve_default=True,
        ),
        AlterNoDBField(
            model_name='cephpool',
            name='pool_snaps',
            field=nodb.models.JsonField(base_type=list, editable=False, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='quota_max_bytes',
            field=models.IntegerField(blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='quota_max_objects',
            field=models.IntegerField(blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='stripe_width',
            field=models.IntegerField(editable=False, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='target_max_bytes',
            field=models.IntegerField(blank=True),
            preserve_default=True,
        ),
        AlterNoDBField(
            model_name='cephpool',
            name='tiers',
            field=nodb.models.JsonField(base_type=list, editable=False, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='cephpool',
            name='type',
            field=models.CharField(blank=True, max_length=100, choices=[(b'replicated', b'replicated'), (b'erasure', b'erasure')]),
            preserve_default=True,
        ),
    ]
