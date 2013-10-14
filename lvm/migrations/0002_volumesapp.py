# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;
# vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    depends_on = (
            ("volumes", "0001_initial"),
        )

    def forwards(self, orm):
        db.start_transaction()
        db.execute("INSERT INTO volumes_volumepool (id, capflags) "
                   "SELECT id, 0 FROM lvm_volumegroup")
        db.execute("INSERT INTO volumes_blockvolume (id, capflags, pool_id) "
                   "SELECT id, 0, vg_id from lvm_logicalvolume")
        db.execute("INSERT INTO volumes_filesystemvolume "
                   "SELECT id, 0, vg_id, filesystem, owner_id, fswarning, fscritical "
                   "FROM lvm_logicalvolume "
                   "WHERE filesystem NOT IN ('', 'zfs', 'btrfs')")
        db.execute("INSERT INTO volumes_filesystemprovider "
                   "SELECT id, id "
                   "FROM lvm_logicalvolume "
                   "WHERE filesystem NOT IN ('', 'zfs', 'btrfs')")
        db.execute("UPDATE volumes_blockvolume "
                   "SET "
                     "upper_type_id = (SELECT id FROM django_content_type WHERE app_label='volumes' AND model='filesystemprovider'), "
                     "upper_id = id "
                   "WHERE id IN (SELECT id FROM volumes_filesystemprovider)")
        db.execute("SELECT setval( 'volumes_volumepool_id_seq', ( select max(id) from volumes_volumepool ) )")
        db.execute("SELECT setval( 'volumes_blockvolume_id_seq', ( select max(id) from volumes_blockvolume ) )")
        db.execute("SELECT setval( 'volumes_filesystemvolume_id_seq', ( select max(id) from volumes_filesystemvolume ) )")
        db.rename_column('lvm_volumegroup',    'id', 'volumepool_ptr_id' )
        db.rename_column('lvm_logicalvolume',  'id', 'blockvolume_ptr_id')
        db.commit_transaction()

    def backwards(self, orm):
        db.rename_column('lvm_volumegroup',    'volumepool_ptr_id',  'id')
        db.rename_column('lvm_logicalvolume',  'blockvolume_ptr_id', 'id')


    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'cron.cronjob': {
            'Meta': {'object_name': 'Cronjob'},
            'command': ('django.db.models.fields.CharField', [], {'max_length': '500'}),
            'domonth': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'doweek': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'host': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.Host']"}),
            'hour': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'minute': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'month': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'user': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'ifconfig.host': {
            'Meta': {'object_name': 'Host'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '63'})
        },
        'lvm.btrfssubvolume': {
            'Meta': {'unique_together': "(('volume', 'name'),)", 'object_name': 'BtrfsSubvolume'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'readonly': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'snapshot': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'snapshot_set'", 'null': 'True', 'to': "orm['lvm.BtrfsSubvolume']"}),
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.LogicalVolume']"})
        },
        'lvm.logicalvolume': {
            'Meta': {'unique_together': "(('vg', 'name'),)", 'object_name': 'LogicalVolume', '_ormbases': ['volumes.BlockVolume']},
            'blockvolume_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['volumes.BlockVolume']", 'unique': 'True', 'primary_key': 'True'}),
            'compression': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'createdate': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'null': 'True', 'blank': 'True'}),
            'dedup': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'filesystem': ('django.db.models.fields.CharField', [], {'max_length': '20', 'blank': 'True'}),
            'formatted': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'fscritical': ('django.db.models.fields.IntegerField', [], {'default': '85'}),
            'fswarning': ('django.db.models.fields.IntegerField', [], {'default': '75'}),
            'megs': ('django.db.models.fields.IntegerField', [], {}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '130'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']", 'blank': 'True'}),
            'snapshot': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'snapshot_set'", 'null': 'True', 'to': "orm['lvm.LogicalVolume']"}),
            'snapshotconf': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'snapshot_set'", 'null': 'True', 'to': "orm['lvm.SnapshotConf']"}),
            'uuid': ('django.db.models.fields.CharField', [], {'max_length': '38', 'blank': 'True'}),
            'vg': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.VolumeGroup']", 'blank': 'True'})
        },
        'lvm.logicalvolumeconf': {
            'Meta': {'object_name': 'LogicalVolumeConf'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'snapshot_conf': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.SnapshotConf']"}),
            'snapshot_space': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.LogicalVolume']"})
        },
        'lvm.lvmetadata': {
            'Meta': {'object_name': 'LVMetadata'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'key': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'value': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.LogicalVolume']"})
        },
        'lvm.lvsnapshotjob': {
            'Meta': {'object_name': 'LVSnapshotJob', '_ormbases': ['cron.Cronjob']},
            'conf': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.SnapshotConf']"}),
            'cronjob_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['cron.Cronjob']", 'unique': 'True', 'primary_key': 'True'}),
            'end_time': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'start_time': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'})
        },
        'lvm.snapshotconf': {
            'Meta': {'object_name': 'SnapshotConf'},
            'confname': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'last_execution': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'postscript': ('django.db.models.fields.CharField', [], {'max_length': '225', 'null': 'True'}),
            'prescript': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True'}),
            'retention_time': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        'lvm.volumegroup': {
            'Meta': {'object_name': 'VolumeGroup', '_ormbases': ['volumes.VolumePool']},
            'host': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.Host']", 'null': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '130'}),
            'volumepool_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['volumes.VolumePool']", 'unique': 'True', 'primary_key': 'True'})
        },
        'lvm.zfssnapshot': {
            'Meta': {'object_name': 'ZfsSnapshot'},
            'created_at': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'snapname': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'subvolume': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.ZfsSubvolume']", 'null': 'True', 'blank': 'True'}),
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.LogicalVolume']"})
        },
        'lvm.zfssubvolume': {
            'Meta': {'object_name': 'ZfsSubvolume'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'volname': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.LogicalVolume']"})
        },
        'volumes.blockvolume': {
            'Meta': {'object_name': 'BlockVolume'},
            'capflags': ('django.db.models.fields.BigIntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'pool': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['volumes.VolumePool']", 'null': 'True', 'blank': 'True'}),
            'upper_id': ('django.db.models.fields.PositiveIntegerField', [], {}),
            'upper_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"})
        },
        'volumes.volumepool': {
            'Meta': {'object_name': 'VolumePool'},
            'capflags': ('django.db.models.fields.BigIntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        }
    }

    complete_apps = ['lvm']