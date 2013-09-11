# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'BlockVolume'
        db.create_table('volumes_blockvolume', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('content_type', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['contenttypes.ContentType'])),
            ('object_id', self.gf('django.db.models.fields.PositiveIntegerField')()),
        ))
        db.send_create_signal('volumes', ['BlockVolume'])

        # Adding model 'FileSystem'
        db.create_table('volumes_filesystem', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('fstype', self.gf('django.db.models.fields.CharField')(max_length=250)),
        ))
        db.send_create_signal('volumes', ['FileSystem'])

        # Adding model 'FileSystemVolume'
        db.create_table('volumes_filesystemvolume', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('content_type', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['contenttypes.ContentType'])),
            ('object_id', self.gf('django.db.models.fields.PositiveIntegerField')()),
            ('filesystem', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['volumes.FileSystem'])),
        ))
        db.send_create_signal('volumes', ['FileSystemVolume'])


    def backwards(self, orm):
        # Deleting model 'BlockVolume'
        db.delete_table('volumes_blockvolume')

        # Deleting model 'FileSystem'
        db.delete_table('volumes_filesystem')

        # Deleting model 'FileSystemVolume'
        db.delete_table('volumes_filesystemvolume')


    models = {
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'volumes.blockvolume': {
            'Meta': {'object_name': 'BlockVolume'},
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'object_id': ('django.db.models.fields.PositiveIntegerField', [], {})
        },
        'volumes.filesystem': {
            'Meta': {'object_name': 'FileSystem'},
            'fstype': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        },
        'volumes.filesystemvolume': {
            'Meta': {'object_name': 'FileSystemVolume'},
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'filesystem': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['volumes.FileSystem']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'object_id': ('django.db.models.fields.PositiveIntegerField', [], {})
        }
    }

    complete_apps = ['volumes']