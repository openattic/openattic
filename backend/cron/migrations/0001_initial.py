# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ifconfig', '0002_auto_20160329_1248'),
    ]

    operations = [
        migrations.CreateModel(
            name='Cronjob',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('user', models.CharField(max_length=50)),
                ('minute', models.CharField(max_length=50)),
                ('hour', models.CharField(max_length=50)),
                ('domonth', models.CharField(max_length=50)),
                ('month', models.CharField(max_length=50)),
                ('doweek', models.CharField(max_length=50)),
                ('command', models.CharField(max_length=500)),
                ('host', models.ForeignKey(to='ifconfig.Host')),
            ],
        ),
    ]
