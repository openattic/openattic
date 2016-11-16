# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cron', '0001_initial'),
        ('volumes', '__first__'),
        ('ifconfig', '0002_auto_20160329_1248'),
    ]

    operations = [
        migrations.CreateModel(
            name='LogicalVolume',
            fields=[
                ('blockvolume_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.BlockVolume')),
                ('snapshot', models.ForeignKey(related_name='snapshot_set', blank=True, to='lvm.LogicalVolume', null=True)),
            ],
            options={
                'abstract': False,
            },
            bases=('volumes.blockvolume',),
        ),
        migrations.CreateModel(
            name='LogicalVolumeConf',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('snapshot_space', models.IntegerField(null=True, blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='LVMetadata',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('key', models.CharField(max_length=255)),
                ('value', models.CharField(max_length=255)),
                ('volume', models.ForeignKey(to='lvm.LogicalVolume')),
            ],
        ),
        migrations.CreateModel(
            name='LVSnapshotJob',
            fields=[
                ('cronjob_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='cron.Cronjob')),
                ('start_time', models.DateTimeField(null=True, blank=True)),
                ('end_time', models.DateTimeField(null=True, blank=True)),
                ('is_active', models.BooleanField(default=False)),
            ],
            bases=('cron.cronjob',),
        ),
        migrations.CreateModel(
            name='SnapshotConf',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('confname', models.CharField(max_length=255, null=True)),
                ('prescript', models.CharField(max_length=255, null=True)),
                ('postscript', models.CharField(max_length=225, null=True)),
                ('retention_time', models.IntegerField(null=True, blank=True)),
                ('last_execution', models.DateTimeField(null=True, blank=True)),
            ],
        ),
        migrations.CreateModel(
            name='VolumeGroup',
            fields=[
                ('volumepool_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.VolumePool')),
                ('host', models.ForeignKey(to='ifconfig.Host', null=True)),
            ],
            bases=('volumes.volumepool',),
        ),
        migrations.AddField(
            model_name='lvsnapshotjob',
            name='conf',
            field=models.ForeignKey(to='lvm.SnapshotConf'),
        ),
        migrations.AddField(
            model_name='logicalvolumeconf',
            name='snapshot_conf',
            field=models.ForeignKey(to='lvm.SnapshotConf'),
        ),
        migrations.AddField(
            model_name='logicalvolumeconf',
            name='volume',
            field=models.ForeignKey(to='lvm.LogicalVolume'),
        ),
        migrations.AddField(
            model_name='logicalvolume',
            name='snapshotconf',
            field=models.ForeignKey(related_name='snapshot_set', blank=True, to='lvm.SnapshotConf', null=True),
        ),
        migrations.AddField(
            model_name='logicalvolume',
            name='vg',
            field=models.ForeignKey(to='lvm.VolumeGroup', blank=True),
        ),
    ]
