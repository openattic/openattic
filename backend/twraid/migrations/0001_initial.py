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
            name='Controller',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('index', models.IntegerField()),
                ('bbustate', models.CharField(max_length=150, blank=True)),
                ('model', models.CharField(max_length=150, blank=True)),
                ('serial', models.CharField(max_length=150, blank=True)),
                ('actdrives', models.IntegerField()),
                ('curdrives', models.IntegerField()),
                ('maxdrives', models.IntegerField()),
                ('actunits', models.IntegerField()),
                ('curunits', models.IntegerField()),
                ('maxunits', models.IntegerField()),
                ('autorebuild', models.BooleanField(default=False)),
                ('host', models.ForeignKey(to='ifconfig.Host')),
            ],
        ),
        migrations.CreateModel(
            name='Disk',
            fields=[
                ('physicalblockdevice_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.PhysicalBlockDevice')),
                ('port', models.IntegerField()),
                ('type', models.CharField(max_length=150)),
                ('enclslot', models.IntegerField()),
                ('megs', models.IntegerField()),
                ('model', models.CharField(max_length=150)),
                ('unitindex', models.IntegerField(null=True, blank=True)),
                ('serial', models.CharField(max_length=150, blank=True)),
                ('rpm', models.IntegerField()),
                ('status', models.CharField(max_length=150, blank=True)),
                ('temp_c', models.IntegerField()),
                ('linkspeed', models.CharField(max_length=150, blank=True)),
                ('power_on_h', models.IntegerField()),
                ('controller', models.ForeignKey(to='twraid.Controller')),
            ],
            bases=('volumes.physicalblockdevice',),
        ),
        migrations.CreateModel(
            name='Enclosure',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('index', models.IntegerField()),
                ('alarms', models.IntegerField(default=0)),
                ('slots', models.IntegerField(default=0)),
                ('fans', models.IntegerField(default=0)),
                ('tsunits', models.IntegerField(default=0)),
                ('psunits', models.IntegerField(default=0)),
                ('controller', models.ForeignKey(to='twraid.Controller')),
            ],
        ),
        migrations.CreateModel(
            name='Unit',
            fields=[
                ('blockvolume_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.BlockVolume')),
                ('index', models.IntegerField()),
                ('serial', models.CharField(max_length=150, blank=True)),
                ('unittype', models.CharField(max_length=150, blank=True)),
                ('status', models.CharField(max_length=150, blank=True)),
                ('rebuild', models.IntegerField(null=True, blank=True)),
                ('verify', models.IntegerField(null=True, blank=True)),
                ('chunksize', models.IntegerField(null=True, blank=True)),
                ('autoverify', models.BooleanField(default=False)),
                ('rdcache', models.CharField(max_length=150, blank=True)),
                ('wrcache', models.CharField(max_length=150, blank=True)),
                ('controller', models.ForeignKey(to='twraid.Controller')),
            ],
            options={
                'abstract': False,
            },
            bases=('volumes.blockvolume',),
        ),
        migrations.AddField(
            model_name='disk',
            name='encl',
            field=models.ForeignKey(to='twraid.Enclosure'),
        ),
        migrations.AddField(
            model_name='disk',
            name='unit',
            field=models.ForeignKey(blank=True, to='twraid.Unit', null=True),
        ),
    ]
