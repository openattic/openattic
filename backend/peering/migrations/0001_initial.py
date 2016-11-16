# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import peering.models


class Migration(migrations.Migration):

    dependencies = [
        ('ifconfig', '0002_auto_20160329_1248'),
    ]

    operations = [
        migrations.CreateModel(
            name='PeerHost',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('base_url', peering.models.PeerUrlField(max_length=250)),
                ('clusterpeer', models.BooleanField(default=False, help_text=b'Set to true if I am in a Pacemaker cluster with this peer.')),
                ('host', models.ForeignKey(to='ifconfig.Host')),
            ],
        ),
    ]
