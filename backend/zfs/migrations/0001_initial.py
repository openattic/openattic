# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('volumes', '0001_initial'),
        ('ifconfig', '0002_auto_20160329_1248'),
    ]

    operations = [
        migrations.CreateModel(
            name='RaidZ',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(max_length=150)),
                ('type', models.CharField(max_length=150)),
            ],
        ),
        migrations.CreateModel(
            name='Zfs',
            fields=[
                ('filesystemvolume_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.FileSystemVolume')),
                ('parent', models.ForeignKey(blank=True, to='volumes.StorageObject', null=True)),
            ],
            options={
                'abstract': False,
            },
            bases=('volumes.filesystemvolume',),
        ),
        migrations.CreateModel(
            name='Zpool',
            fields=[
                ('volumepool_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.VolumePool')),
                ('host', models.ForeignKey(to='ifconfig.Host')),
            ],
            bases=('volumes.volumepool',),
        ),
        migrations.CreateModel(
            name='ZVol',
            fields=[
                ('blockvolume_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.BlockVolume')),
                ('zpool', models.ForeignKey(to='zfs.Zpool')),
            ],
            options={
                'abstract': False,
            },
            bases=('volumes.blockvolume',),
        ),
        migrations.AddField(
            model_name='zfs',
            name='zpool',
            field=models.ForeignKey(to='zfs.Zpool'),
        ),
        migrations.AddField(
            model_name='raidz',
            name='zpool',
            field=models.ForeignKey(to='zfs.Zpool'),
        ),
    ]
