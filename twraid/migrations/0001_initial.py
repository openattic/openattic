# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Controller'
        db.create_table('twraid_controller', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('host', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.Host'])),
            ('index', self.gf('django.db.models.fields.IntegerField')()),
            ('bbustate', self.gf('django.db.models.fields.CharField')(max_length=150, blank=True)),
            ('model', self.gf('django.db.models.fields.CharField')(max_length=150, blank=True)),
            ('serial', self.gf('django.db.models.fields.CharField')(max_length=150, blank=True)),
            ('actdrives', self.gf('django.db.models.fields.IntegerField')()),
            ('curdrives', self.gf('django.db.models.fields.IntegerField')()),
            ('maxdrives', self.gf('django.db.models.fields.IntegerField')()),
            ('actunits', self.gf('django.db.models.fields.IntegerField')()),
            ('curunits', self.gf('django.db.models.fields.IntegerField')()),
            ('maxunits', self.gf('django.db.models.fields.IntegerField')()),
            ('autorebuild', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('twraid', ['Controller'])

        # Adding model 'Enclosure'
        db.create_table('twraid_enclosure', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('index', self.gf('django.db.models.fields.IntegerField')()),
            ('controller', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['twraid.Controller'])),
            ('alarms', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('slots', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('fans', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('tsunits', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('psunits', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal('twraid', ['Enclosure'])

        # Adding model 'Unit'
        db.create_table('twraid_unit', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('index', self.gf('django.db.models.fields.IntegerField')()),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=150, blank=True)),
            ('serial', self.gf('django.db.models.fields.CharField')(max_length=150, blank=True)),
            ('controller', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['twraid.Controller'])),
            ('unittype', self.gf('django.db.models.fields.CharField')(max_length=150, blank=True)),
            ('status', self.gf('django.db.models.fields.CharField')(max_length=150, blank=True)),
            ('rebuild', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('verify', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('chunksize', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('size', self.gf('django.db.models.fields.IntegerField')()),
            ('autoverify', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('rdcache', self.gf('django.db.models.fields.CharField')(max_length=150, blank=True)),
            ('wrcache', self.gf('django.db.models.fields.CharField')(max_length=150, blank=True)),
        ))
        db.send_create_signal('twraid', ['Unit'])

        # Adding model 'Disk'
        db.create_table('twraid_disk', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('controller', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['twraid.Controller'])),
            ('port', self.gf('django.db.models.fields.IntegerField')()),
            ('disktype', self.gf('django.db.models.fields.CharField')(max_length=150)),
            ('encl', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['twraid.Enclosure'])),
            ('enclslot', self.gf('django.db.models.fields.IntegerField')()),
            ('size', self.gf('django.db.models.fields.IntegerField')()),
            ('model', self.gf('django.db.models.fields.CharField')(max_length=150)),
            ('unit', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['twraid.Unit'], null=True, blank=True)),
            ('unitindex', self.gf('django.db.models.fields.IntegerField')(null=True, blank=True)),
            ('serial', self.gf('django.db.models.fields.CharField')(max_length=150, blank=True)),
            ('rpm', self.gf('django.db.models.fields.IntegerField')()),
            ('status', self.gf('django.db.models.fields.CharField')(max_length=150, blank=True)),
            ('temp_c', self.gf('django.db.models.fields.IntegerField')()),
            ('linkspeed', self.gf('django.db.models.fields.CharField')(max_length=150, blank=True)),
            ('power_on_h', self.gf('django.db.models.fields.IntegerField')()),
        ))
        db.send_create_signal('twraid', ['Disk'])


    def backwards(self, orm):
        # Deleting model 'Controller'
        db.delete_table('twraid_controller')

        # Deleting model 'Enclosure'
        db.delete_table('twraid_enclosure')

        # Deleting model 'Unit'
        db.delete_table('twraid_unit')

        # Deleting model 'Disk'
        db.delete_table('twraid_disk')


    models = {
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
            'Meta': {'object_name': 'Unit'},
            'autoverify': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'chunksize': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'}),
            'controller': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['twraid.Controller']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
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
        }
    }

    complete_apps = ['twraid']