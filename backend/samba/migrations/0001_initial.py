# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('volumes', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Share',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('name', models.CharField(unique=True, max_length=50)),
                ('path', models.CharField(max_length=255)),
                ('available', models.BooleanField(default=True)),
                ('browseable', models.BooleanField(default=True)),
                ('guest_ok', models.BooleanField(default=False)),
                ('writeable', models.BooleanField(default=True)),
                ('comment', models.CharField(max_length=250, blank=True)),
                ('volume', models.ForeignKey(to='volumes.FileSystemVolume')),
            ],
        ),
    ]
