# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='TaskQueue',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('task', models.TextField(help_text=b'The JSON-serialized task to run.')),
                ('result', models.CharField(help_text=b'The return value of the task queue.', max_length=1024, null=True, editable=False, blank=True)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('last_modified', models.DateTimeField(auto_now=True, null=True)),
                ('status', models.IntegerField(default=1, help_text=b'A state-machine: not-started -> running -> finished | exception', editable=False, choices=[(1, b'Not Started'), (2, b'Running'), (3, b'Finished'), (4, b'Exception'), (5, b'Aborted')])),
                ('percent', models.IntegerField(default=0)),
                ('description', models.CharField(max_length=128)),
            ],
        ),
    ]
