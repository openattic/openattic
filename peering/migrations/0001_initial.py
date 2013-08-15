# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'PeerHost'
        db.create_table('peering_peerhost', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('host', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.Host'])),
            ('base_url', self.gf('peering.models.PeerUrlField')(max_length=250)),
            ('clusterpeer', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('peering', ['PeerHost'])


    def backwards(self, orm):
        # Deleting model 'PeerHost'
        db.delete_table('peering_peerhost')


    models = {
        'ifconfig.host': {
            'Meta': {'object_name': 'Host'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '63'})
        },
        'peering.peerhost': {
            'Meta': {'object_name': 'PeerHost'},
            'base_url': ('peering.models.PeerUrlField', [], {'max_length': '250'}),
            'clusterpeer': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'host': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.Host']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        }
    }

    complete_apps = ['peering']