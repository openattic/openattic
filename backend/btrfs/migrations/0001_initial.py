# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('volumes', '__first__'),
        ('ifconfig', '0002_auto_20160329_1248'),
    ]

    operations = [
        migrations.CreateModel(
            name='Btrfs',
            fields=[
                ('volumepool_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.VolumePool')),
                ('host', models.ForeignKey(to='ifconfig.Host')),
            ],
            bases=('volumes.volumepool',),
        ),
        migrations.CreateModel(
            name='BtrfsSubvolume',
            fields=[
                ('filesystemvolume_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.FileSystemVolume')),
                ('btrfs', models.ForeignKey(to='btrfs.Btrfs')),
                ('parent', models.ForeignKey(blank=True, to='volumes.StorageObject', null=True)),
            ],
            options={
                'abstract': False,
            },
            bases=('volumes.filesystemvolume',),
        ),
    ]
