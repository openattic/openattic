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
            name='HostACL',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('lun_id', models.IntegerField()),
                ('host', models.ForeignKey(to='ifconfig.Host')),
            ],
        ),
        migrations.CreateModel(
            name='Initiator',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('wwn', models.CharField(unique=True, max_length=250)),
                ('type', models.CharField(max_length=10, choices=[(b'iscsi', b'iscsi'), (b'qla2xxx', b'qla2xxx')])),
                ('host', models.ForeignKey(to='ifconfig.Host')),
            ],
        ),
        migrations.CreateModel(
            name='Portal',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('port', models.IntegerField(default=3260)),
                ('ipaddress', models.ForeignKey(to='ifconfig.IPAddress')),
            ],
        ),
        migrations.AddField(
            model_name='hostacl',
            name='portals',
            field=models.ManyToManyField(to='lio.Portal'),
        ),
        migrations.AddField(
            model_name='hostacl',
            name='volume',
            field=models.ForeignKey(to='volumes.BlockVolume'),
        ),
        migrations.AlterUniqueTogether(
            name='portal',
            unique_together=set([('ipaddress', 'port')]),
        ),
    ]
