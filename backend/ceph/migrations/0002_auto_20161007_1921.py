# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cepherasurecodeprofile',
            name='ruleset_failure_domain',
            field=models.CharField(max_length=100, blank=True),
        ),
    ]
