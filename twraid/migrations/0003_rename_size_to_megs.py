# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        db.start_transaction()
        db.rename_column('twraid_unit', 'size', 'megs')
        db.rename_column('twraid_disk', 'size', 'megs')
        db.commit_transaction()

    def backwards(self, orm):
        db.start_transaction()
        db.rename_column('twraid_unit', 'megs', 'size')
        db.rename_column('twraid_disk', 'megs', 'size')
        db.commit_transaction()

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
        'twraid.controller': {
            'Meta': {'object_name': 'Controller'},
            'actdrives': ('django.db.models.fields.IntegerField', [], {}),
            'actunits': ('django.db.models.fields.IntegerField', [], {}),
            'autorebuild': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'bbustate': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'}),
            'curdrives': ('django.db.models.fields.IntegerField', [], {}),
            'curunits': ('django.db.models.fields.IntegerField', [], {}),
            'host': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.Host']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'index': ('django.db.models.fields.IntegerField', [], {}),
            'maxdrives': ('django.db.models.fields.IntegerField', [], {}),
            'maxunits': ('django.db.models.fields.IntegerField', [], {}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'}),
            'serial': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'})
        },
        'twraid.disk': {
            'Meta': {'object_name': 'Disk'},
            'controller': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['twraid.Controller']"}),
            'disktype': ('django.db.models.fields.CharField', [], {'max_length': '150'}),
            'encl': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['twraid.Enclosure']"}),
            'enclslot': ('django.db.models.fields.IntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'linkspeed': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'}),
            'megs': ('django.db.models.fields.IntegerField', [], {}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '150'}),
            'port': ('django.db.models.fields.IntegerField', [], {}),
            'power_on_h': ('django.db.models.fields.IntegerField', [], {}),
            'rpm': ('django.db.models.fields.IntegerField', [], {}),
            'serial': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'}),
            'status': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'}),
            'temp_c': ('django.db.models.fields.IntegerField', [], {}),
            'unit': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['twraid.Unit']", 'null': 'True', 'blank': 'True'}),
            'unitindex': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        'twraid.enclosure': {
            'Meta': {'object_name': 'Enclosure'},
            'alarms': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'controller': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['twraid.Controller']"}),
            'fans': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'index': ('django.db.models.fields.IntegerField', [], {}),
            'psunits': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'slots': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'tsunits': ('django.db.models.fields.IntegerField', [], {'default': '0'})
        },
        'twraid.unit': {
            'Meta': {'object_name': 'Unit', '_ormbases': ['volumes.BlockVolume']},
            'autoverify': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'blockvolume_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['volumes.BlockVolume']", 'unique': 'True', 'primary_key': 'True'}),
            'chunksize': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'controller': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['twraid.Controller']"}),
            'index': ('django.db.models.fields.IntegerField', [], {}),
            'megs': ('django.db.models.fields.IntegerField', [], {}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'}),
            'rdcache': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'}),
            'rebuild': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'serial': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'}),
            'status': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'}),
            'unittype': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'}),
            'verify': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'wrcache': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'})
        },
        'volumes.blockvolume': {
            'Meta': {'object_name': 'BlockVolume'},
            'capflags': ('django.db.models.fields.BigIntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'pool': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['volumes.VolumePool']", 'null': 'True', 'blank': 'True'}),
            'upper_id': ('django.db.models.fields.PositiveIntegerField', [], {'null': 'True', 'blank': 'True'}),
            'upper_type': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'blockvolume_upper_type_set'", 'null': 'True', 'to': "orm['contenttypes.ContentType']"}),
            'volume_type': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'blockvolume_volume_type_set'", 'null': 'True', 'to': "orm['contenttypes.ContentType']"})
        },
        'volumes.volumepool': {
            'Meta': {'object_name': 'VolumePool'},
            'capflags': ('django.db.models.fields.BigIntegerField', [], {}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'volumepool_type': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'volumepool_volumepool_type_set'", 'null': 'True', 'to': "orm['contenttypes.ContentType']"})
        }
    }

    complete_apps = ['twraid']