# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('volumes', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Export',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('path', models.CharField(max_length=255)),
                ('address', models.CharField(max_length=250)),
                ('options', models.CharField(default=b'rw,no_subtree_check,no_root_squash', max_length=250)),
                ('volume', models.ForeignKey(to='volumes.FileSystemVolume')),
            ],
        ),
    ]
