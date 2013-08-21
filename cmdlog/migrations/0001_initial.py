# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'LogEntry'
        db.create_table('cmdlog_logentry', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('host', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.Host'])),
            ('command', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('user', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('starttime', self.gf('django.db.models.fields.DateTimeField')()),
            ('endtime', self.gf('django.db.models.fields.DateTimeField')()),
            ('exitcode', self.gf('django.db.models.fields.IntegerField')()),
            ('text', self.gf('django.db.models.fields.TextField')()),
        ))
        db.send_create_signal('cmdlog', ['LogEntry'])


    def backwards(self, orm):
        # Deleting model 'LogEntry'
        db.delete_table('cmdlog_logentry')


    models = {
        'cmdlog.logentry': {
            'Meta': {'object_name': 'LogEntry'},
            'command': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'endtime': ('django.db.models.fields.DateTimeField', [], {}),
            'exitcode': ('django.db.models.fields.IntegerField', [], {}),
            'host': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.Host']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'starttime': ('django.db.models.fields.DateTimeField', [], {}),
            'text': ('django.db.models.fields.TextField', [], {}),
            'user': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'ifconfig.host': {
            'Meta': {'object_name': 'Host'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '63'})
        }
    }

    complete_apps = ['cmdlog']