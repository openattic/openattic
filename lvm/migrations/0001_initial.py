# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'VolumeGroup'
        db.create_table('lvm_volumegroup', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=130)),
            ('host', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.Host'], null=True)),
        ))
        db.send_create_signal('lvm', ['VolumeGroup'])

        # Adding model 'LogicalVolume'
        db.create_table('lvm_logicalvolume', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=130)),
            ('megs', self.gf('django.db.models.fields.IntegerField')()),
            ('vg', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.VolumeGroup'], blank=True)),
            ('snapshot', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='snapshot_set', null=True, to=orm['lvm.LogicalVolume'])),
            ('filesystem', self.gf('django.db.models.fields.CharField')(max_length=20, blank=True)),
            ('formatted', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('owner', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'], blank=True)),
            ('fswarning', self.gf('django.db.models.fields.IntegerField')(default=75)),
            ('fscritical', self.gf('django.db.models.fields.IntegerField')(default=85)),
            ('uuid', self.gf('django.db.models.fields.CharField')(max_length=38, blank=True)),
            ('dedup', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('compression', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('createdate', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, null=True, blank=True)),
            ('snapshotconf', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='snapshot_set', null=True, to=orm['lvm.SnapshotConf'])),
        ))
        db.send_create_signal('lvm', ['LogicalVolume'])

        # Adding unique constraint on 'LogicalVolume', fields ['vg', 'name']
        db.create_unique('lvm_logicalvolume', ['vg_id', 'name'])

        # Adding model 'ZfsSubvolume'
        db.create_table('lvm_zfssubvolume', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('volume', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.LogicalVolume'])),
            ('volname', self.gf('django.db.models.fields.CharField')(max_length=50)),
        ))
        db.send_create_signal('lvm', ['ZfsSubvolume'])

        # Adding model 'ZfsSnapshot'
        db.create_table('lvm_zfssnapshot', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('volume', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.LogicalVolume'])),
            ('subvolume', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.ZfsSubvolume'], null=True, blank=True)),
            ('snapname', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('created_at', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('lvm', ['ZfsSnapshot'])

        # Adding model 'BtrfsSubvolume'
        db.create_table('lvm_btrfssubvolume', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('volume', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.LogicalVolume'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('snapshot', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='snapshot_set', null=True, to=orm['lvm.BtrfsSubvolume'])),
            ('readonly', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('lvm', ['BtrfsSubvolume'])

        # Adding unique constraint on 'BtrfsSubvolume', fields ['volume', 'name']
        db.create_unique('lvm_btrfssubvolume', ['volume_id', 'name'])

        # Adding model 'LVMetadata'
        db.create_table('lvm_lvmetadata', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('volume', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.LogicalVolume'])),
            ('key', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('value', self.gf('django.db.models.fields.CharField')(max_length=255)),
        ))
        db.send_create_signal('lvm', ['LVMetadata'])

        # Adding model 'LVSnapshotJob'
        db.create_table('lvm_lvsnapshotjob', (
            ('cronjob_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['cron.Cronjob'], unique=True, primary_key=True)),
            ('start_time', self.gf('django.db.models.fields.DateTimeField')(null=True, blank=True)),
            ('end_time', self.gf('django.db.models.fields.DateTimeField')(null=True, blank=True)),
            ('is_active', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('conf', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.SnapshotConf'])),
        ))
        db.send_create_signal('lvm', ['LVSnapshotJob'])

        # Adding model 'SnapshotConf'
        db.create_table('lvm_snapshotconf', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('confname', self.gf('django.db.models.fields.CharField')(max_length=255, null=True)),
            ('prescript', self.gf('django.db.models.fields.CharField')(max_length=255, null=True)),
            ('postscript', self.gf('django.db.models.fields.CharField')(max_length=225, null=True)),
            ('retention_time', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('last_execution', self.gf('django.db.models.fields.DateTimeField')(null=True, blank=True)),
        ))
        db.send_create_signal('lvm', ['SnapshotConf'])

        # Adding model 'LogicalVolumeConf'
        db.create_table('lvm_logicalvolumeconf', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('snapshot_conf', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.SnapshotConf'])),
            ('volume', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.LogicalVolume'])),
            ('snapshot_space', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
        ))
        db.send_create_signal('lvm', ['LogicalVolumeConf'])


    def backwards(self, orm):
        # Removing unique constraint on 'BtrfsSubvolume', fields ['volume', 'name']
        db.delete_unique('lvm_btrfssubvolume', ['volume_id', 'name'])

        # Removing unique constraint on 'LogicalVolume', fields ['vg', 'name']
        db.delete_unique('lvm_logicalvolume', ['vg_id', 'name'])

        # Deleting model 'VolumeGroup'
        db.delete_table('lvm_volumegroup')

        # Deleting model 'LogicalVolume'
        db.delete_table('lvm_logicalvolume')

        # Deleting model 'ZfsSubvolume'
        db.delete_table('lvm_zfssubvolume')

        # Deleting model 'ZfsSnapshot'
        db.delete_table('lvm_zfssnapshot')

        # Deleting model 'BtrfsSubvolume'
        db.delete_table('lvm_btrfssubvolume')

        # Deleting model 'LVMetadata'
        db.delete_table('lvm_lvmetadata')

        # Deleting model 'LVSnapshotJob'
        db.delete_table('lvm_lvsnapshotjob')

        # Deleting model 'SnapshotConf'
        db.delete_table('lvm_snapshotconf')

        # Deleting model 'LogicalVolumeConf'
        db.delete_table('lvm_logicalvolumeconf')


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
            'Meta': {'unique_together': "(('vg', 'name'),)", 'object_name': 'LogicalVolume'},
            'compression': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'createdate': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'null': 'True', 'blank': 'True'}),
            'dedup': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'filesystem': ('django.db.models.fields.CharField', [], {'max_length': '20', 'blank': 'True'}),
            'formatted': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'fscritical': ('django.db.models.fields.IntegerField', [], {'default': '85'}),
            'fswarning': ('django.db.models.fields.IntegerField', [], {'default': '75'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
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
            'Meta': {'object_name': 'VolumeGroup'},
            'host': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.Host']", 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '130'})
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
        }
    }

    complete_apps = ['lvm']