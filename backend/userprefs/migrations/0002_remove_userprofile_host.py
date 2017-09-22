# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('userprefs', '0001_initial'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='userprofile',
            unique_together=set([('user',)]),
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='host',
        ),
    ]
