# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models

from nodb.models import AlterNoDBField, JsonField


class Migration(migrations.Migration):

    dependencies = [
        ('volumes', '0001_initial'),
        ('ceph', '0003_allow_blanks_in_cephpool'),
    ]

    run_before = [
        ('volumes', '0002_remove'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='cluster',
            name='storageobject_ptr',
        ),
        migrations.RemoveField(
            model_name='entity',
            name='cluster',
        ),
        migrations.RemoveField(
            model_name='image',
            name='blockvolume_ptr',
        ),
        migrations.RemoveField(
            model_name='image',
            name='rbd_pool',
        ),
        migrations.RemoveField(
            model_name='mds',
            name='cluster',
        ),
        migrations.RemoveField(
            model_name='mds',
            name='host',
        ),
        migrations.RemoveField(
            model_name='mon',
            name='cluster',
        ),
        migrations.RemoveField(
            model_name='mon',
            name='host',
        ),
        migrations.AlterUniqueTogether(
            name='osd',
            unique_together=set([]),
        ),
        migrations.RemoveField(
            model_name='osd',
            name='cluster',
        ),
        migrations.RemoveField(
            model_name='osd',
            name='journal',
        ),
        migrations.RemoveField(
            model_name='osd',
            name='volume',
        ),
        migrations.AlterUniqueTogether(
            name='pool',
            unique_together=set([]),
        ),
        migrations.RemoveField(
            model_name='pool',
            name='cluster',
        ),
        migrations.RemoveField(
            model_name='pool',
            name='volumepool_ptr',
        ),
        migrations.AlterModelOptions(
            name='crushmapversion',
            options={'managed': True},
        ),
        AlterNoDBField(
            model_name='crushmapversion',
            name='crushmap',
            field=JsonField(base_type=dict),
        ),
        migrations.AlterUniqueTogether(
            name='crushmapversion',
            unique_together=set([]),
        ),
        migrations.DeleteModel(
            name='Entity',
        ),
        migrations.DeleteModel(
            name='Image',
        ),
        migrations.DeleteModel(
            name='MDS',
        ),
        migrations.DeleteModel(
            name='Mon',
        ),
        migrations.DeleteModel(
            name='OSD',
        ),
        migrations.DeleteModel(
            name='Pool',
        ),
        migrations.RemoveField(
            model_name='crushmapversion',
            name='author',
        ),
        migrations.RemoveField(
            model_name='crushmapversion',
            name='cluster',
        ),
        migrations.RemoveField(
            model_name='crushmapversion',
            name='created_at',
        ),
        migrations.RemoveField(
            model_name='crushmapversion',
            name='edited_at',
        ),
        migrations.RemoveField(
            model_name='crushmapversion',
            name='epoch',
        ),
        migrations.DeleteModel(
            name='Cluster',
        ),
    ]
