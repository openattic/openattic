# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('taskqueue', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='taskqueue',
            name='description',
            field=models.TextField(),
        ),
        migrations.AlterField(
            model_name='taskqueue',
            name='result',
            field=models.TextField(help_text=b'The return value of the task queue.', null=True, editable=False, blank=True),
        ),
    ]
