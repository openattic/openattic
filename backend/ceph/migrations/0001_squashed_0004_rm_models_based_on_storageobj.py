# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import nodb.models
from django.conf import settings


class Migration(migrations.Migration):
    replaces = [(b'ceph', '0001_initial'), (b'ceph', '0002_auto_20161007_1921'),
                (b'ceph', '0003_allow_blanks_in_cephpool'),
                (b'ceph', '0004_rm_models_based_on_storageobj')]

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('ifconfig', '0002_auto_20160329_1248'),
    ]

    operations = [
        migrations.CreateModel(
            name='CephCluster',
            fields=[
                ('fsid', models.CharField(max_length=36, serialize=False, primary_key=True)),
                ('name', models.CharField(max_length=100)),
                ('health', models.CharField(max_length=11)),
                ('performance_data_options', nodb.models.JsonField(base_type=list, editable=False)),
            ],
            options={
                'abstract': False,
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='CephErasureCodeProfile',
            fields=[
                ('name', models.CharField(max_length=100, serialize=False, primary_key=True)),
                ('k', models.IntegerField()),
                ('m', models.IntegerField()),
                ('plugin', models.CharField(max_length=100, editable=False)),
                ('technique', models.CharField(max_length=100, editable=False)),
                ('jerasure_per_chunk_alignment', models.CharField(max_length=100, editable=False)),
                ('ruleset_failure_domain', models.CharField(max_length=100, blank=True)),
                ('ruleset_root', models.CharField(max_length=100, editable=False)),
                ('w', models.IntegerField(editable=False)),
            ],
            options={
                'abstract': False,
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='CephOsd',
            fields=[
                ('id', models.IntegerField(serialize=False, editable=False, primary_key=True)),
                ('crush_weight', models.FloatField()),
                ('exists', models.IntegerField(editable=False)),
                ('name', models.CharField(max_length=100, editable=False)),
                ('primary_affinity', models.FloatField()),
                ('reweight', models.FloatField()),
                ('status', models.CharField(max_length=100, editable=False)),
                ('type', models.CharField(max_length=100, editable=False)),
                ('hostname', models.CharField(max_length=256, editable=False)),
                ('in_state', models.IntegerField()),
                ('kb', models.IntegerField(editable=False)),
                ('kb_used', models.IntegerField(editable=False)),
                ('kb_avail', models.IntegerField(editable=False)),
            ],
            options={
                'abstract': False,
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='CephPg',
            fields=[
                ('acting', nodb.models.JsonField(base_type=list, editable=False)),
                ('acting_primary', models.IntegerField()),
                ('blocked_by', nodb.models.JsonField(base_type=list, editable=False)),
                ('created', models.IntegerField()),
                ('last_active', models.DateTimeField(null=True)),
                ('last_became_active', models.DateTimeField()),
                ('last_became_peered', models.DateTimeField()),
                ('last_change', models.DateTimeField()),
                ('last_clean', models.DateTimeField()),
                ('last_clean_scrub_stamp', models.DateTimeField()),
                ('last_deep_scrub', models.DateTimeField()),
                ('last_deep_scrub_stamp', models.DateTimeField()),
                ('last_epoch_clean', models.IntegerField()),
                ('last_fresh', models.DateTimeField()),
                ('last_fullsized', models.DateTimeField()),
                ('last_peered', models.DateTimeField()),
                ('last_scrub', models.DateTimeField()),
                ('last_scrub_stamp', models.DateTimeField()),
                ('last_undegraded', models.DateTimeField()),
                ('last_unstale', models.DateTimeField()),
                ('log_size', models.IntegerField()),
                ('log_start', models.CharField(max_length=100)),
                ('mapping_epoch', models.IntegerField()),
                ('ondisk_log_size', models.IntegerField()),
                ('ondisk_log_start', models.CharField(max_length=100)),
                ('parent', models.CharField(max_length=100)),
                ('parent_split_bits', models.IntegerField()),
                ('pgid', models.CharField(max_length=100, serialize=False, primary_key=True)),
                ('reported_epoch', models.CharField(max_length=100)),
                ('reported_seq', models.CharField(max_length=100)),
                ('stat_sum', nodb.models.JsonField(base_type=dict, editable=False)),
                ('state', models.CharField(help_text=b'http://docs.ceph.com/docs/master/rados/operations/pg-states/', max_length=100)),
                ('stats_invalid', models.CharField(max_length=100)),
                ('up', nodb.models.JsonField(base_type=list, editable=False)),
                ('up_primary', models.IntegerField()),
                ('version', models.CharField(max_length=100)),
                ('osd_id', models.IntegerField()),
                ('pool_name', models.CharField(max_length=100)),
            ],
            options={
                'abstract': False,
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='CephPool',
            fields=[
                ('id', models.IntegerField(serialize=False, editable=False, primary_key=True)),
                ('name', models.CharField(max_length=100)),
                ('type', models.CharField(blank=True, max_length=100,
                                   choices=[(b'replicated', b'replicated'),
                                            (b'erasure', b'erasure')])),
                ('last_change', models.IntegerField(editable=False, blank=True)),
                ('quota_max_objects', models.IntegerField(blank=True)),
                ('quota_max_bytes', models.IntegerField(blank=True)),
                ('full', models.BooleanField(default=None, editable=False)),
                ('pg_num', models.IntegerField(blank=True)),
                ('pgp_num', models.IntegerField(editable=False, blank=True)),
                ('size', models.IntegerField(help_text=b'Replica size', null=True, blank=True)),
                ('min_size', models.IntegerField(help_text=b'Replica size', null=True, blank=True)),
                ('crush_ruleset', models.IntegerField(blank=True)),
                ('crash_replay_interval', models.IntegerField(blank=True)),
                ('num_bytes', models.IntegerField(editable=False, blank=True)),
                ('num_objects', models.IntegerField(editable=False, blank=True)),
                ('max_avail', models.IntegerField(editable=False, blank=True)),
                ('kb_used', models.IntegerField(editable=False, blank=True)),
                ('stripe_width', models.IntegerField(editable=False, blank=True)),
                ('cache_mode', models.CharField(blank=True, max_length=100,
                                   choices=[(b'none', b'none'), (b'writeback', b'writeback'),
                                            (b'forward', b'forward'), (b'readonly', b'readonly'),
                                            (b'readforward', b'readforward'),
                                            (b'readproxy', b'readproxy')])),
                ('target_max_bytes', models.IntegerField(blank=True)),
                ('hit_set_period', models.IntegerField(blank=True)),
                ('hit_set_count', models.IntegerField(blank=True)),
                ('hit_set_params', nodb.models.JsonField(base_type=dict, editable=False, blank=True)),
                ('tiers', nodb.models.JsonField(base_type=list, editable=False, blank=True)),
                ('flags', nodb.models.JsonField(base_type=list, editable=False, blank=True)),
                ('pool_snaps', nodb.models.JsonField(base_type=list, editable=False, blank=True)),
                ('cluster', models.ForeignKey(blank=True, editable=False, to='ceph.CephCluster', null=True)),
                ('erasure_code_profile', models.ForeignKey(default=None, blank=True, to='ceph.CephErasureCodeProfile', null=True)),
                ('read_tier', models.ForeignKey(related_name='related_read_tier', default=None, blank=True, to='ceph.CephPool', null=True)),
                ('tier_of', models.ForeignKey(related_name='related_tier_of', default=None, blank=True, to='ceph.CephPool', null=True)),
                ('write_tier', models.ForeignKey(related_name='related_write_tier', default=None, blank=True, to='ceph.CephPool', null=True)),
            ],
            options={
                'abstract': False,
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='CephFs',
            fields=[
                ('name', models.CharField(max_length=100, serialize=False, primary_key=True)),
                ('data_pools', nodb.models.JsonField(base_type=list)),
                ('metadata_pool', models.ForeignKey(related_name='metadata_of_ceph_fs', to='ceph.CephPool'),)
            ],
            options={
                'abstract': False,
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='CephRbd',
            fields=[
                ('id', models.CharField(help_text=b'pool-name/image-name', max_length=100, serialize=False, editable=False, primary_key=True)),
                ('name', models.CharField(max_length=100)),
                ('size', models.IntegerField(default=4294967296, help_text=b'Bytes, where size modulo obj_size === 0')),
                ('obj_size', models.IntegerField(default=4194304, help_text=b'obj_size === 2^n', null=True, blank=True)),
                ('num_objs', models.IntegerField(editable=False)),
                ('block_name_prefix', models.CharField(max_length=100, editable=False)),
                ('features', nodb.models.JsonField(
                    help_text=b'For example: ["deep-flatten", "journaling", "stripingv2", "exclusive-lock", "layering", "object-map", "fast-diff"]',
                    null=True, base_type=list, blank=True)),
                ('old_format', models.BooleanField(default=False, help_text=b'should always be false')),
                ('used_size', models.IntegerField(editable=False)),
                ('pool', models.ForeignKey(to='ceph.CephPool')),
            ],
            options={
                'abstract': False,
                'managed': True,
            },
        ),
        migrations.CreateModel(
            name='CrushmapVersion',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('crushmap', nodb.models.JsonField(base_type=dict)),
            ],
            options={'managed': True},
        ),


    ]
