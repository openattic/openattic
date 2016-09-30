# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('volumes', '0001_initial'),
        ('ifconfig', '0002_auto_20160329_1248'),
    ]

    operations = [
        migrations.CreateModel(
            name='Connection',
            fields=[
                ('blockvolume_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.BlockVolume')),
                ('protocol', models.CharField(default=b'C', max_length=1, choices=[(b'A', b'Protocol A: write IO is reported as completed, if it has reached local disk and local TCP send buffer.'), (b'B', b'Protocol B: write IO is reported as completed, if it has reached local disk and remote buffer cache.'), (b'C', b'Protocol C: write IO is reported as completed, if it has reached both local and remote disk.')])),
                ('syncer_rate', models.CharField(default=b'5M', help_text=b'Bandwidth limit for background synchronization, measured in K/M/G<b><i>Bytes</i></b>.', max_length=25, blank=True)),
            ],
            options={
                'abstract': False,
            },
            bases=('volumes.blockvolume',),
        ),
        migrations.CreateModel(
            name='DeviceMinor',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('minor', models.IntegerField(unique=True)),
                ('connection', models.OneToOneField(null=True, on_delete=django.db.models.deletion.SET_NULL, to='drbd.Connection')),
            ],
        ),
        migrations.CreateModel(
            name='Endpoint',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('connection', models.ForeignKey(related_name='endpoint_set', to='drbd.Connection')),
                ('ipaddress', models.ForeignKey(to='ifconfig.IPAddress')),
                ('volume', models.ForeignKey(related_name='accessor_endpoint_set', to='volumes.BlockVolume')),
            ],
        ),
    ]
