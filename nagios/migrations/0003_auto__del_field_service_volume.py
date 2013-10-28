# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Deleting field 'Service.volume'
        db.delete_column('nagios_service', 'volume_id')


    def backwards(self, orm):
        # Adding field 'Service.volume'
        db.add_column('nagios_service', 'volume',
                      self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.LogicalVolume'], null=True, blank=True),
                      keep_default=False)


    models = {
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
        'nagios.command': {
            'Meta': {'object_name': 'Command'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '250'}),
            'query_only': ('django.db.models.fields.BooleanField', [], {'default': 'False'})
        },
        'nagios.graph': {
            'Meta': {'object_name': 'Graph'},
            'command': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['nagios.Command']"}),
            'fields': ('django.db.models.fields.CharField', [], {'max_length': '500'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '250'}),
            'verttitle': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'})
        },
        'nagios.service': {
            'Meta': {'unique_together': "(('host', 'description'),)", 'object_name': 'Service'},
            'arguments': ('django.db.models.fields.CharField', [], {'max_length': '500', 'blank': 'True'}),
            'command': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['nagios.Command']"}),
            'description': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'host': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.Host']", 'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'target_id': ('django.db.models.fields.PositiveIntegerField', [], {'null': 'True', 'blank': 'True'}),
            'target_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']", 'null': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['nagios']