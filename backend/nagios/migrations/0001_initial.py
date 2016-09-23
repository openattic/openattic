# -*- coding: utf-8 -*-
from __future__ import unicode_literals

import django
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name' if django.VERSION[:2] >= (1, 8) else '0001_initial'),
        ('ifconfig', '0002_auto_20160329_1248'),
    ]

    operations = [
        migrations.CreateModel(
            name='Command',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(unique=True, max_length=250)),
                ('query_only', models.BooleanField(default=False, help_text='Check this if openATTIC should not configure services with this command, only query those that exist.')),
            ],
        ),
        migrations.CreateModel(
            name='Graph',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('title', models.CharField(unique=True, max_length=250)),
                ('verttitle', models.CharField(max_length=250, blank=True)),
                ('fields', models.CharField(max_length=500)),
                ('command', models.ForeignKey(to='nagios.Command')),
            ],
        ),
        migrations.CreateModel(
            name='Service',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('target_id', models.PositiveIntegerField(null=True, blank=True)),
                ('description', models.CharField(max_length=250)),
                ('arguments', models.CharField(default=b'', max_length=500, blank=True)),
                ('command', models.ForeignKey(to='nagios.Command')),
                ('host', models.ForeignKey(blank=True, to='ifconfig.Host', null=True)),
                ('target_type', models.ForeignKey(blank=True, to='contenttypes.ContentType', null=True)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='service',
            unique_together=set([('host', 'description')]),
        ),
    ]
