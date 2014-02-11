# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Deleting field 'Share.dir_mode'
        db.delete_column('samba_share', 'dir_mode')

        # Deleting field 'Share.create_mode'
        db.delete_column('samba_share', 'create_mode')

        # Removing M2M table for field write_list on 'Share'
        db.delete_table('samba_share_write_list')

        # Removing M2M table for field read_list on 'Share'
        db.delete_table('samba_share_read_list')

        # Removing M2M table for field valid_users on 'Share'
        db.delete_table('samba_share_valid_users')

        # Removing M2M table for field invalid_users on 'Share'
        db.delete_table('samba_share_invalid_users')


        # Changing field 'Share.volume'
        db.alter_column('samba_share', 'volume_id', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['volumes.FileSystemVolume']))

    def backwards(self, orm):
        # Adding field 'Share.dir_mode'
        db.add_column('samba_share', 'dir_mode',
                      self.gf('django.db.models.fields.CharField')(default='0775', max_length=5),
                      keep_default=False)

        # Adding field 'Share.create_mode'
        db.add_column('samba_share', 'create_mode',
                      self.gf('django.db.models.fields.CharField')(default='0664', max_length=5),
                      keep_default=False)

        # Adding M2M table for field write_list on 'Share'
        db.create_table('samba_share_write_list', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('share', models.ForeignKey(orm['samba.share'], null=False)),
            ('user', models.ForeignKey(orm['auth.user'], null=False))
        ))
        db.create_unique('samba_share_write_list', ['share_id', 'user_id'])

        # Adding M2M table for field read_list on 'Share'
        db.create_table('samba_share_read_list', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('share', models.ForeignKey(orm['samba.share'], null=False)),
            ('user', models.ForeignKey(orm['auth.user'], null=False))
        ))
        db.create_unique('samba_share_read_list', ['share_id', 'user_id'])

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


        # Changing field 'Share.volume'
        db.alter_column('samba_share', 'volume_id', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.LogicalVolume']))

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
        'samba.share': {
            'Meta': {'object_name': 'Share'},
            'available': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'browseable': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'comment': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'guest_ok': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '50'}),
            'path': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['volumes.FileSystemVolume']"}),
            'writeable': ('django.db.models.fields.BooleanField', [], {'default': 'True'})
        },
        'volumes.filesystemvolume': {
            'Meta': {'object_name': 'FileSystemVolume'},
            'capflags': ('django.db.models.fields.BigIntegerField', [], {'default': '0'}),
            'filesystem': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'fscritical': ('django.db.models.fields.IntegerField', [], {'default': '85'}),
            'fswarning': ('django.db.models.fields.IntegerField', [], {'default': '75'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']", 'blank': 'True'}),
            'pool': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['volumes.VolumePool']", 'null': 'True', 'blank': 'True'}),
            'volume_type': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'filesystemvolume_volume_type_set'", 'null': 'True', 'to': "orm['contenttypes.ContentType']"})
        },
        'volumes.volumepool': {
            'Meta': {'object_name': 'VolumePool'},
            'capflags': ('django.db.models.fields.BigIntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'volumepool_type': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'volumepool_volumepool_type_set'", 'null': 'True', 'to': "orm['contenttypes.ContentType']"})
        }
    }

    complete_apps = ['samba']