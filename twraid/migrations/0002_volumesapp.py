# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;
# vim: tabstop=4 expandtab shiftwidth=4 softtabstop=4

import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    depends_on = (
            ("volumes", "0002_add_volume_type"),
        )

    def forwards(self, orm):
        db.start_transaction()
        # Completely clear the database, migrate it, and then let the cronjob re-fill it.
        db.clear_table('twraid_disk')
        db.clear_table('twraid_unit')
        db.clear_table('twraid_enclosure')
        db.clear_table('twraid_controller')
        db.commit_transaction()

        db.start_transaction()
        # Deleting field 'Unit.id'
        db.delete_column('twraid_unit', 'id')

        # Adding field 'Unit.blockvolume_ptr'
        db.add_column('twraid_unit', 'blockvolume_ptr',
                      self.gf('django.db.models.fields.related.OneToOneField')(default=2, to=orm['volumes.BlockVolume'], unique=True, primary_key=True),
                      keep_default=False)
        db.commit_transaction()


    def backwards(self, orm):
        # Adding field 'Unit.id'
        db.add_column('twraid_unit', 'id',
                      self.gf('django.db.models.fields.AutoField')(default=2, primary_key=True),
                      keep_default=False)

        # Deleting field 'Unit.blockvolume_ptr'
        db.delete_column('twraid_unit', 'blockvolume_ptr_id')


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
            'model': ('django.db.models.fields.CharField', [], {'max_length': '150'}),
            'port': ('django.db.models.fields.IntegerField', [], {}),
            'power_on_h': ('django.db.models.fields.IntegerField', [], {}),
            'rpm': ('django.db.models.fields.IntegerField', [], {}),
            'serial': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'}),
            'size': ('django.db.models.fields.IntegerField', [], {}),
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
            'name': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'}),
            'rdcache': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'}),
            'rebuild': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'serial': ('django.db.models.fields.CharField', [], {'max_length': '150', 'blank': 'True'}),
            'size': ('django.db.models.fields.IntegerField', [], {}),
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
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        }
    }

    complete_apps = ['twraid']