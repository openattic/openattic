# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ifconfig', '0002_auto_20160329_1248'),
    ]

    operations = [
        migrations.CreateModel(
            name='LogEntry',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('command', models.CharField(max_length=250, verbose_name='Command')),
                ('user', models.CharField(max_length=50)),
                ('starttime', models.DateTimeField(verbose_name='Start time')),
                ('endtime', models.DateTimeField(verbose_name='End time')),
                ('exitcode', models.IntegerField(verbose_name='Exit code')),
                ('text', models.TextField(verbose_name='Output')),
                ('host', models.ForeignKey(to='ifconfig.Host')),
            ],
        ),
    ]
