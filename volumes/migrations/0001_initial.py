# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'VolumePool'
        db.create_table('volumes_volumepool', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('capflags', self.gf('django.db.models.fields.BigIntegerField')()),
        ))
        db.send_create_signal('volumes', ['VolumePool'])

        # Adding model 'BlockVolume'
        db.create_table('volumes_blockvolume', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('capflags', self.gf('django.db.models.fields.BigIntegerField')()),
            ('pool', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['volumes.VolumePool'], null=True, blank=True)),
            ('upper_type', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['contenttypes.ContentType'], null=True, blank=True)),
            ('upper_id', self.gf('django.db.models.fields.PositiveIntegerField')(null=True, blank=True)),
        ))
        db.send_create_signal('volumes', ['BlockVolume'])

        # Adding model 'FileSystemVolume'
        db.create_table('volumes_filesystemvolume', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('capflags', self.gf('django.db.models.fields.BigIntegerField')()),
            ('pool', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['volumes.VolumePool'], null=True, blank=True)),
            ('filesystem', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('owner', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['auth.User'], blank=True)),
            ('fswarning', self.gf('django.db.models.fields.IntegerField')(default=75)),
            ('fscritical', self.gf('django.db.models.fields.IntegerField')(default=85)),
        ))
        db.send_create_signal('volumes', ['FileSystemVolume'])

        # Adding model 'FileSystemProvider'
        db.create_table('volumes_filesystemprovider', (
            ('filesystemvolume_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['volumes.FileSystemVolume'], unique=True, primary_key=True)),
            ('base', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['volumes.BlockVolume'])),
        ))
        db.send_create_signal('volumes', ['FileSystemProvider'])


    def backwards(self, orm):
        # Deleting model 'VolumePool'
        db.delete_table('volumes_volumepool')

        # Deleting model 'BlockVolume'
        db.delete_table('volumes_blockvolume')

        # Deleting model 'FileSystemVolume'
        db.delete_table('volumes_filesystemvolume')

        # Deleting model 'FileSystemProvider'
        db.delete_table('volumes_filesystemprovider')


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
        'volumes.blockvolume': {
            'Meta': {'object_name': 'BlockVolume'},
            'capflags': ('django.db.models.fields.BigIntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'pool': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['volumes.VolumePool']", 'null': 'True', 'blank': 'True'}),
            'upper_id': ('django.db.models.fields.PositiveIntegerField', [], {'null': 'True', 'blank': 'True'}),
            'upper_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']", 'null': 'True', 'blank': 'True'})
        },
        'volumes.filesystemprovider': {
            'Meta': {'object_name': 'FileSystemProvider', '_ormbases': ['volumes.FileSystemVolume']},
            'base': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['volumes.BlockVolume']"}),
            'filesystemvolume_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['volumes.FileSystemVolume']", 'unique': 'True', 'primary_key': 'True'})
        },
        'volumes.filesystemvolume': {
            'Meta': {'object_name': 'FileSystemVolume'},
            'capflags': ('django.db.models.fields.BigIntegerField', [], {}),
            'filesystem': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'fscritical': ('django.db.models.fields.IntegerField', [], {'default': '85'}),
            'fswarning': ('django.db.models.fields.IntegerField', [], {'default': '75'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']", 'blank': 'True'}),
            'pool': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['volumes.VolumePool']", 'null': 'True', 'blank': 'True'})
        },
        'volumes.volumepool': {
            'Meta': {'object_name': 'VolumePool'},
            'capflags': ('django.db.models.fields.BigIntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        }
    }

    complete_apps = ['volumes']