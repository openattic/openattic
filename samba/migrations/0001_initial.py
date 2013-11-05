# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    needed_by = (
        ("lvm", "0002_volumesapp"),
    )

    def forwards(self, orm):
        # Adding model 'Share'
        db.create_table('samba_share', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('volume', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.LogicalVolume'])),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=50)),
            ('path', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('available', self.gf('django.db.models.fields.BooleanField')(default=True)),
            ('browseable', self.gf('django.db.models.fields.BooleanField')(default=True)),
            ('guest_ok', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('writeable', self.gf('django.db.models.fields.BooleanField')(default=True)),
            ('create_mode', self.gf('django.db.models.fields.CharField')(default='0664', max_length=5)),
            ('dir_mode', self.gf('django.db.models.fields.CharField')(default='0775', max_length=5)),
            ('comment', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
        ))
        db.send_create_signal('samba', ['Share'])

        # Adding M2M table for field valid_users on 'Share'
        db.create_table('samba_share_valid_users', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('share', models.ForeignKey(orm['samba.share'], null=False)),
            ('user', models.ForeignKey(orm['auth.user'], null=False))
        ))
        db.create_unique('samba_share_valid_users', ['share_id', 'user_id'])

        # Adding M2M table for field invalid_users on 'Share'
        db.create_table('samba_share_invalid_users', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('share', models.ForeignKey(orm['samba.share'], null=False)),
            ('user', models.ForeignKey(orm['auth.user'], null=False))
        ))
        db.create_unique('samba_share_invalid_users', ['share_id', 'user_id'])

        # Adding M2M table for field read_list on 'Share'
        db.create_table('samba_share_read_list', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('share', models.ForeignKey(orm['samba.share'], null=False)),
            ('user', models.ForeignKey(orm['auth.user'], null=False))
        ))
        db.create_unique('samba_share_read_list', ['share_id', 'user_id'])

        # Adding M2M table for field write_list on 'Share'
        db.create_table('samba_share_write_list', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('share', models.ForeignKey(orm['samba.share'], null=False)),
            ('user', models.ForeignKey(orm['auth.user'], null=False))
        ))
        db.create_unique('samba_share_write_list', ['share_id', 'user_id'])


    def backwards(self, orm):
        # Deleting model 'Share'
        db.delete_table('samba_share')

        # Removing M2M table for field valid_users on 'Share'
        db.delete_table('samba_share_valid_users')

        # Removing M2M table for field invalid_users on 'Share'
        db.delete_table('samba_share_invalid_users')

        # Removing M2M table for field read_list on 'Share'
        db.delete_table('samba_share_read_list')

        # Removing M2M table for field write_list on 'Share'
        db.delete_table('samba_share_write_list')


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
        'ifconfig.host': {
            'Meta': {'object_name': 'Host'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '63'})
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
        'samba.share': {
            'Meta': {'object_name': 'Share'},
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'browseable': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'comment': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'create_mode': ('django.db.models.fields.CharField', [], {'default': "'0664'", 'max_length': '5'}),
            'dir_mode': ('django.db.models.fields.CharField', [], {'default': "'0775'", 'max_length': '5'}),
            'guest_ok': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'invalid_users': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'invalid_user_share_set'", 'blank': 'True', 'to': "orm['auth.User']"}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '50'}),
            'path': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'read_list': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'read_user_share_set'", 'blank': 'True', 'to': "orm['auth.User']"}),
            'valid_users': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'valid_user_share_set'", 'blank': 'True', 'to': "orm['auth.User']"}),
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.LogicalVolume']"}),
            'write_list': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'write_user_share_set'", 'blank': 'True', 'to': "orm['auth.User']"}),
            'writeable': ('django.db.models.fields.BooleanField', [], {'default': 'True'})
        }
    }

    complete_apps = ['samba']