# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
import nodb.models


class Migration(migrations.Migration):

    dependencies = [
        ('ceph', '0015_cephpool_application_metadata'),
    ]

    operations = [
        migrations.AddField(
            model_name='cephcluster',
            name='osd_flags',
            field=nodb.models.JsonField(default=[], help_text=b'supported flags: full|pause|noup|nodown|noout|noin|nobackfill|norebalance|norecover|noscrub|nodeep-scrub|notieragent|sortbitwise|recovery_deletes|require_jewel_osds|require_kraken_osds', base_type=list),
        ),
    ]
