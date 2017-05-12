# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ceph_deployment', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='cephminion',
            name='cluster',
        ),
        migrations.DeleteModel(
            name='CephMinion',
        ),
    ]
