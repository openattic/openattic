# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations
import nodb.models


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0008_rbd_stripe_info'),
    ]

    operations = [
        nodb.models.AlterNoDBField(
            model_name='cephpool',
            name='flags',
            field=nodb.models.JsonField(default=[], base_type=list, blank=True),
            preserve_default=True,
        ),
    ]
