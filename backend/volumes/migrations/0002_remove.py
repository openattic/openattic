# -*- coding: utf-8 -*-
"""
 *  Copyright (c) 2017 SUSE LLC
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""

# Django 1.7+ is not capable to render a consistent state of executing this migrations. Thus,
# Django is also not capable of generating the SQL statements.
# I'm getting:
#
# > django.db.migrations.state.InvalidBasesError: Cannot resolve bases for [<ModelState: 'volumes.GenericDisk'>]
# > This can happen if you are inheriting models from an app with migrations (e.g. contrib.auth)
# > in an app with no migrations; see https://docs.djangoproject.com/en/1.8/topics/migrations/#dependencies for more
#
# This is wrong. This migration now uses manual written SQL to perform the same steps as an
# automatic migration would generate. It then applies the operations to the database state.
#
# Without `state_operations`, `manage.py makemigrations` would generate the same migrations again,
# as it doesn't understand the custom SQL.

from __future__ import unicode_literals

from django.db import migrations, models

sql_clear = """
BEGIN;
ALTER TABLE "volumes_diskdevice" DROP COLUMN "host_id" CASCADE;
ALTER TABLE "volumes_diskdevice" DROP COLUMN "physicalblockdevice_ptr_id" CASCADE;
ALTER TABLE "volumes_filesystemprovider" DROP COLUMN "filesystemvolume_ptr_id" CASCADE;
ALTER TABLE "volumes_filesystemvolume" DROP COLUMN "owner_id" CASCADE;
ALTER TABLE "volumes_filesystemvolume" DROP COLUMN "volume_type_id" CASCADE;
ALTER TABLE "volumes_genericdisk" DROP COLUMN "disk_device_id" CASCADE;
ALTER TABLE "volumes_physicalblockdevice" DROP COLUMN "device_type_id" CASCADE;
ALTER TABLE "volumes_physicalblockdevice" DROP COLUMN "storageobj_id" CASCADE;
ALTER TABLE "volumes_storageobject" DROP COLUMN "source_pool_id" CASCADE;
ALTER TABLE "volumes_volumepool" DROP COLUMN "storageobj_id" CASCADE;
ALTER TABLE "volumes_volumepool" DROP COLUMN "volumepool_type_id" CASCADE;
DROP TABLE "volumes_diskdevice" CASCADE;
DROP TABLE "volumes_filesystemprovider" CASCADE;
DROP TABLE "volumes_filesystemvolume" CASCADE;
DROP TABLE "volumes_physicalblockdevice" CASCADE;
DROP TABLE "volumes_volumepool" CASCADE;

ALTER TABLE "volumes_blockvolume" DROP COLUMN "storageobj_id" CASCADE;
ALTER TABLE "volumes_blockvolume" DROP COLUMN "volume_type_id" CASCADE;
ALTER TABLE "volumes_storageobject" DROP COLUMN "snapshot_id" CASCADE;
ALTER TABLE "volumes_storageobject" DROP COLUMN "upper_id" CASCADE;

ALTER TABLE "volumes_genericdisk" DROP COLUMN "blockvolume_ptr_id" CASCADE;
DROP TABLE "volumes_storageobject" CASCADE;
DROP TABLE "volumes_blockvolume" CASCADE;
DROP TABLE IF EXISTS "volumes_genericdisk" CASCADE ;
COMMIT;
"""

state_operations = [
        migrations.RemoveField(
            model_name='blockvolume',
            name='storageobj',
        ),
        migrations.RemoveField(
            model_name='blockvolume',
            name='volume_type',
        ),
        migrations.RemoveField(
            model_name='diskdevice',
            name='host',
        ),
        migrations.RemoveField(
            model_name='diskdevice',
            name='physicalblockdevice_ptr',
        ),
        migrations.RemoveField(
            model_name='filesystemprovider',
            name='filesystemvolume_ptr',
        ),
        migrations.RemoveField(
            model_name='filesystemvolume',
            name='owner',
        ),
        migrations.RemoveField(
            model_name='filesystemvolume',
            name='storageobj',
        ),
        migrations.RemoveField(
            model_name='filesystemvolume',
            name='volume_type',
        ),
        migrations.RemoveField(
            model_name='genericdisk',
            name='blockvolume_ptr',
        ),
        migrations.RemoveField(
            model_name='genericdisk',
            name='disk_device',
        ),
        migrations.RemoveField(
            model_name='physicalblockdevice',
            name='device_type',
        ),
        migrations.RemoveField(
            model_name='physicalblockdevice',
            name='storageobj',
        ),
        migrations.RemoveField(
            model_name='storageobject',
            name='snapshot',
        ),
        migrations.RemoveField(
            model_name='storageobject',
            name='source_pool',
        ),
        migrations.RemoveField(
            model_name='storageobject',
            name='upper',
        ),
        migrations.RemoveField(
            model_name='volumepool',
            name='storageobj',
        ),
        migrations.RemoveField(
            model_name='volumepool',
            name='volumepool_type',
        ),
        migrations.DeleteModel(
            name='BlockVolume',
        ),
        migrations.DeleteModel(
            name='DiskDevice',
        ),
        migrations.DeleteModel(
            name='FileSystemProvider',
        ),
        migrations.DeleteModel(
            name='FileSystemVolume',
        ),
        migrations.DeleteModel(
            name='GenericDisk',
        ),
        migrations.DeleteModel(
            name='PhysicalBlockDevice',
        ),
        migrations.DeleteModel(
            name='StorageObject',
        ),
        migrations.DeleteModel(
            name='VolumePool',
        ),
    ]

class Migration(migrations.Migration):

    dependencies = [
        ('volumes', '0001_initial'),
    ]
    operations = [
        migrations.RunSQL(sql=sql_clear, state_operations=state_operations)
    ]

