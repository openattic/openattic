# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations
from nodb.models import AlterNoDBField, JsonField


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0010_remove_cephcluster_performance_data_options'),
    ]

    operations = [
        AlterNoDBField(
            model_name='cephrbd',
            name='features',
            field=JsonField(default=[], help_text=b'For example: ["deep-flatten", "journaling", "stripingv2", "exclusive-lock", "layering", "object-map", "fast-diff"]', null=True, base_type=list, blank=True),
        ),
    ]
