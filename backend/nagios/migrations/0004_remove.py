# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('nagios', '0003_remove_traditional_fixtures'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='graph',
            name='command',
        ),
        migrations.DeleteModel(
            name='Graph',
        ),
        migrations.AlterUniqueTogether(
            name='service',
            unique_together=None,
        ),
        migrations.RemoveField(
            model_name='service',
            name='command',
        ),
        migrations.DeleteModel(
            name='Command',
        ),
        migrations.RemoveField(
            model_name='service',
            name='host',
        ),
        migrations.RemoveField(
            model_name='service',
            name='target_type',
        ),
        migrations.DeleteModel(
            name='Service',
        ),
    ]
