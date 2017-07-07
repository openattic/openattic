# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import nodb.models
from nodb.models import AlterNoDBField


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0006_cephosd_osd_objectstore'),
    ]

    operations = [
        AlterNoDBField(
            model_name='cephpool',
            name='flags',
            field=nodb.models.JsonField(base_type=list, blank=True),
            preserve_default=True,
        ),
    ]
