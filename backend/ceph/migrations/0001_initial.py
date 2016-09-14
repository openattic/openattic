# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import nodb.models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('volumes', '0001_initial'),
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
                'managed': False,
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
                ('ruleset_failure_domain', models.CharField(blank=True, max_length=100, choices=[(b'rack', b'rack'), (b'host', b'host'), (b'osd', b'osd')])),
                ('ruleset_root', models.CharField(max_length=100, editable=False)),
                ('w', models.IntegerField(editable=False)),
            ],
            options={
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='CephFs',
            fields=[
                ('name', models.CharField(max_length=100, serialize=False, primary_key=True)),
                ('data_pools', nodb.models.JsonField(base_type=list)),
            ],
            options={
                'managed': False,
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
                'managed': False,
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
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='CephPool',
            fields=[
                ('id', models.IntegerField(serialize=False, editable=False, primary_key=True)),
                ('name', models.CharField(max_length=100)),
                ('type', models.CharField(max_length=100, choices=[(b'replicated', b'replicated'), (b'erasure', b'erasure')])),
                ('last_change', models.IntegerField(editable=False)),
                ('quota_max_objects', models.IntegerField()),
                ('quota_max_bytes', models.IntegerField()),
                ('full', models.BooleanField(default=None, editable=False)),
                ('pg_num', models.IntegerField()),
                ('pgp_num', models.IntegerField(editable=False)),
                ('size', models.IntegerField(help_text=b'Replica size', null=True, blank=True)),
                ('min_size', models.IntegerField(help_text=b'Replica size', null=True, blank=True)),
                ('crush_ruleset', models.IntegerField()),
                ('crash_replay_interval', models.IntegerField()),
                ('num_bytes', models.IntegerField(editable=False)),
                ('num_objects', models.IntegerField(editable=False)),
                ('max_avail', models.IntegerField(editable=False)),
                ('kb_used', models.IntegerField(editable=False)),
                ('stripe_width', models.IntegerField(editable=False)),
                ('cache_mode', models.CharField(max_length=100, choices=[(b'none', b'none'), (b'writeback', b'writeback'), (b'forward', b'forward'), (b'readonly', b'readonly'), (b'readforward', b'readforward'), (b'readproxy', b'readproxy')])),
                ('target_max_bytes', models.IntegerField()),
                ('hit_set_period', models.IntegerField()),
                ('hit_set_count', models.IntegerField()),
                ('hit_set_params', nodb.models.JsonField(base_type=dict, editable=False)),
                ('tiers', nodb.models.JsonField(base_type=list, editable=False)),
                ('flags', nodb.models.JsonField(base_type=list, editable=False)),
                ('pool_snaps', nodb.models.JsonField(base_type=list, editable=False)),
            ],
            options={
                'managed': False,
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
                ('features', nodb.models.JsonField(help_text=b'For example: ["deep-flatten", "journaling", "stripingv2", "exclusive-lock", "layering", "object-map", "fast-diff"]', null=True, base_type=list, blank=True)),
                ('old_format', models.BooleanField(default=False, help_text=b'should always be false')),
                ('used_size', models.IntegerField(editable=False)),
            ],
            options={
                'managed': False,
            },
        ),
        migrations.CreateModel(
            name='Cluster',
            fields=[
                ('storageobject_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.StorageObject')),
                ('auth_cluster_required', models.CharField(default=b'cephx', max_length=10, choices=[(b'none', b'Authentication disabled'), (b'cephx', b'CephX Authentication')])),
                ('auth_service_required', models.CharField(default=b'cephx', max_length=10, choices=[(b'none', b'Authentication disabled'), (b'cephx', b'CephX Authentication')])),
                ('auth_client_required', models.CharField(default=b'cephx', max_length=10, choices=[(b'none', b'Authentication disabled'), (b'cephx', b'CephX Authentication')])),
            ],
            bases=('volumes.storageobject',),
        ),
        migrations.CreateModel(
            name='CrushmapVersion',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('epoch', models.IntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('edited_at', models.DateTimeField(auto_now=True)),
                ('crushmap', models.TextField()),
                ('author', models.ForeignKey(blank=True, to=settings.AUTH_USER_MODEL, null=True)),
                ('cluster', models.ForeignKey(to='ceph.Cluster')),
            ],
        ),
        migrations.CreateModel(
            name='Entity',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('entity', models.CharField(max_length=250)),
                ('key', models.CharField(max_length=50, blank=True)),
                ('cluster', models.ForeignKey(to='ceph.Cluster')),
            ],
        ),
        migrations.CreateModel(
            name='Image',
            fields=[
                ('blockvolume_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.BlockVolume')),
            ],
            options={
                'abstract': False,
            },
            bases=('volumes.blockvolume',),
        ),
        migrations.CreateModel(
            name='MDS',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('cluster', models.ForeignKey(to='ceph.Cluster')),
                ('host', models.ForeignKey(to='ifconfig.Host')),
            ],
        ),
        migrations.CreateModel(
            name='Mon',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('cluster', models.ForeignKey(to='ceph.Cluster')),
                ('host', models.ForeignKey(to='ifconfig.Host')),
            ],
        ),
        migrations.CreateModel(
            name='OSD',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('ceph_id', models.IntegerField()),
                ('uuid', models.CharField(unique=True, max_length=36)),
                ('cluster', models.ForeignKey(to='ceph.Cluster')),
                ('journal', models.ForeignKey(blank=True, to='volumes.BlockVolume', null=True)),
                ('volume', models.ForeignKey(blank=True, to='volumes.FileSystemVolume', null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Pool',
            fields=[
                ('volumepool_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.VolumePool')),
                ('ceph_id', models.IntegerField()),
                ('size', models.IntegerField(default=3)),
                ('min_size', models.IntegerField(default=2)),
                ('ruleset', models.IntegerField(default=0)),
                ('cluster', models.ForeignKey(to='ceph.Cluster')),
            ],
            bases=('volumes.volumepool',),
        ),
        migrations.AddField(
            model_name='image',
            name='rbd_pool',
            field=models.ForeignKey(to='ceph.Pool'),
        ),
        migrations.AlterUniqueTogether(
            name='pool',
            unique_together=set([('cluster', 'ceph_id')]),
        ),
        migrations.AlterUniqueTogether(
            name='osd',
            unique_together=set([('cluster', 'ceph_id')]),
        ),
        migrations.AlterUniqueTogether(
            name='crushmapversion',
            unique_together=set([('cluster', 'epoch')]),
        ),
    ]
