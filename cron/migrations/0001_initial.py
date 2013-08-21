# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Cronjob'
        db.create_table('cron_cronjob', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('host', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.Host'])),
            ('user', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('minute', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('hour', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('domonth', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('month', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('doweek', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('command', self.gf('django.db.models.fields.CharField')(max_length=500)),
        ))
        db.send_create_signal('cron', ['Cronjob'])


    def backwards(self, orm):
        # Deleting model 'Cronjob'
        db.delete_table('cron_cronjob')


    models = {
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
        }
    }

    complete_apps = ['cron']