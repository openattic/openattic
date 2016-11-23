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
            name='Array',
            fields=[
                ('blockvolume_ptr', models.OneToOneField(parent_link=True, auto_created=True, primary_key=True, serialize=False, to='volumes.BlockVolume')),
                ('host', models.ForeignKey(to='ifconfig.Host')),
            ],
            options={
                'abstract': False,
            },
            bases=('volumes.blockvolume',),
        ),
    ]
