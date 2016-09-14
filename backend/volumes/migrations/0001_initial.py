# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('ifconfig', '0002_auto_20160329_1248'),
    ]

    operations = [
        migrations.CreateModel(
            name='BlockVolume',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='FileSystemVolume',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('fswarning', models.IntegerField(default=75, verbose_name='Warning Level (%)')),
                ('fscritical', models.IntegerField(default=85, verbose_name='Critical Level (%)')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='PhysicalBlockDevice',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
            ],
        ),
        migrations.CreateModel(
            name='StorageObject',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=150)),
                ('megs', models.IntegerField()),
                ('uuid', models.CharField(max_length=38, editable=False)),
                ('is_origin', models.BooleanField(default=False)),
                ('createdate', models.DateTimeField(auto_now_add=True, null=True)),
                ('capflags', models.BigIntegerField(default=0)),
                ('is_protected', models.BooleanField(default=False)),
                ('snapshot', models.ForeignKey(related_name='snapshot_storageobject_set', blank=True, to='volumes.StorageObject', null=True)),
            ],
        ),
        migrations.CreateModel(
            name='VolumePool',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('storageobj', models.OneToOneField(to='volumes.StorageObject')),
                ('volumepool_type', models.ForeignKey(related_name='volumepool_volumepool_type_set', blank=True, to='contenttypes.ContentType', null=True)),
            ],
        ),
        migrations.CreateModel(
            name='DiskDevice',
            fields=[
                ('physicalblockdevice_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.PhysicalBlockDevice')),
                ('model', models.CharField(max_length=150, blank=True)),
                ('serial', models.CharField(max_length=150, blank=True)),
                ('type', models.CharField(max_length=150, blank=True)),
                ('rpm', models.IntegerField(null=True, blank=True)),
                ('host', models.ForeignKey(to='ifconfig.Host')),
            ],
            bases=('volumes.physicalblockdevice',),
        ),
        migrations.CreateModel(
            name='FileSystemProvider',
            fields=[
                ('filesystemvolume_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.FileSystemVolume')),
                ('fstype', models.CharField(max_length=100)),
            ],
            options={
                'abstract': False,
            },
            bases=('volumes.filesystemvolume',),
        ),
        migrations.CreateModel(
            name='GenericDisk',
            fields=[
                ('blockvolume_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.BlockVolume')),
                ('disk_device', models.OneToOneField(to='volumes.DiskDevice')),
            ],
            options={
                'abstract': False,
            },
            bases=('volumes.blockvolume',),
        ),
        migrations.AddField(
            model_name='storageobject',
            name='source_pool',
            field=models.ForeignKey(related_name='volume_set', blank=True, to='volumes.VolumePool', null=True),
        ),
        migrations.AddField(
            model_name='storageobject',
            name='upper',
            field=models.ForeignKey(related_name='base_set', blank=True, to='volumes.StorageObject', null=True),
        ),
        migrations.AddField(
            model_name='physicalblockdevice',
            name='device_type',
            field=models.ForeignKey(related_name='physicalblockdevice_volume_type_set', blank=True, to='contenttypes.ContentType', null=True),
        ),
        migrations.AddField(
            model_name='physicalblockdevice',
            name='storageobj',
            field=models.OneToOneField(to='volumes.StorageObject'),
        ),
        migrations.AddField(
            model_name='filesystemvolume',
            name='owner',
            field=models.ForeignKey(to=settings.AUTH_USER_MODEL, blank=True),
        ),
        migrations.AddField(
            model_name='filesystemvolume',
            name='storageobj',
            field=models.OneToOneField(to='volumes.StorageObject'),
        ),
        migrations.AddField(
            model_name='filesystemvolume',
            name='volume_type',
            field=models.ForeignKey(related_name='filesystemvolume_volume_type_set', blank=True, to='contenttypes.ContentType', null=True),
        ),
        migrations.AddField(
            model_name='blockvolume',
            name='storageobj',
            field=models.OneToOneField(to='volumes.StorageObject'),
        ),
        migrations.AddField(
            model_name='blockvolume',
            name='volume_type',
            field=models.ForeignKey(related_name='blockvolume_volume_type_set', blank=True, to='contenttypes.ContentType', null=True),
        ),
    ]
