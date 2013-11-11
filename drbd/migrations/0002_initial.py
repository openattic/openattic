# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Connection'
        db.start_transaction()
        db.create_table('drbd_connection', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('res_name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('ipaddress', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.IPAddress'], null=True, blank=True)),
            ('stack_parent', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='stack_child_set', null=True, to=orm['drbd.Connection'])),
            ('protocol', self.gf('django.db.models.fields.CharField')(default='C', max_length=1)),
            ('wfc_timeout', self.gf('django.db.models.fields.IntegerField')(default=10, null=True, blank=True)),
            ('degr_wfc_timeout', self.gf('django.db.models.fields.IntegerField')(default=120, null=True, blank=True)),
            ('outdated_wfc_timeout', self.gf('django.db.models.fields.IntegerField')(default=15, null=True, blank=True)),
            ('on_io_error', self.gf('django.db.models.fields.CharField')(default='detach', max_length=25)),
            ('fencing', self.gf('django.db.models.fields.CharField')(default='dont-care', max_length=25)),
            ('cram_hmac_alg', self.gf('django.db.models.fields.CharField')(default='sha1', max_length=25)),
            ('secret', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('sb_0pri', self.gf('django.db.models.fields.CharField')(default='discard-younger-primary', max_length=25)),
            ('sb_1pri', self.gf('django.db.models.fields.CharField')(default='discard-secondary', max_length=25)),
            ('sb_2pri', self.gf('django.db.models.fields.CharField')(default='disconnect', max_length=25)),
            ('syncer_rate', self.gf('django.db.models.fields.CharField')(default='5M', max_length=25, blank=True)),
        ))
        db.send_create_signal('drbd', ['Connection'])

        # Adding model 'Endpoint'
        db.create_table('drbd_endpoint', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('connection', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['drbd.Connection'])),
            ('ipaddress', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.IPAddress'])),
        ))
        db.send_create_signal('drbd', ['Endpoint'])
        db.commit_transaction()

    def backwards(self, orm):
        # Deleting model 'Connection'
        db.delete_table('drbd_connection')

        # Deleting model 'Endpoint'
        db.delete_table('drbd_endpoint')


    models = {
        'drbd.connection': {
            'Meta': {'object_name': 'Connection'},
            'cram_hmac_alg': ('django.db.models.fields.CharField', [], {'default': "'sha1'", 'max_length': '25'}),
            'degr_wfc_timeout': ('django.db.models.fields.IntegerField', [], {'default': '120', 'null': 'True', 'blank': 'True'}),
            'fencing': ('django.db.models.fields.CharField', [], {'default': "'dont-care'", 'max_length': '25'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ipaddress': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.IPAddress']", 'null': 'True', 'blank': 'True'}),
            'on_io_error': ('django.db.models.fields.CharField', [], {'default': "'detach'", 'max_length': '25'}),
            'outdated_wfc_timeout': ('django.db.models.fields.IntegerField', [], {'default': '15', 'null': 'True', 'blank': 'True'}),
            'protocol': ('django.db.models.fields.CharField', [], {'default': "'C'", 'max_length': '1'}),
            'res_name': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'sb_0pri': ('django.db.models.fields.CharField', [], {'default': "'discard-younger-primary'", 'max_length': '25'}),
            'sb_1pri': ('django.db.models.fields.CharField', [], {'default': "'discard-secondary'", 'max_length': '25'}),
            'sb_2pri': ('django.db.models.fields.CharField', [], {'default': "'disconnect'", 'max_length': '25'}),
            'secret': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'}),
            'stack_parent': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'stack_child_set'", 'null': 'True', 'to': "orm['drbd.Connection']"}),
            'syncer_rate': ('django.db.models.fields.CharField', [], {'default': "'5M'", 'max_length': '25', 'blank': 'True'}),
            'wfc_timeout': ('django.db.models.fields.IntegerField', [], {'default': '10', 'null': 'True', 'blank': 'True'})
        },
        'drbd.endpoint': {
            'Meta': {'object_name': 'Endpoint'},
            'connection': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['drbd.Connection']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ipaddress': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.IPAddress']"})
        },
        'ifconfig.host': {
            'Meta': {'object_name': 'Host'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '63'})
        },
        'ifconfig.ipaddress': {
            'Meta': {'object_name': 'IPAddress'},
            'address': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'configure': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'device': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.NetDevice']", 'null': 'True', 'blank': 'True'}),
            'domain': ('django.db.models.fields.CharField', [], {'max_length': '250', 'null': 'True', 'blank': 'True'}),
            'gateway': ('django.db.models.fields.CharField', [], {'max_length': '50', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'nameservers': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'})
        },
        'ifconfig.netdevice': {
            'Meta': {'unique_together': "(('host', 'devname'),)", 'object_name': 'NetDevice'},
            'auto': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'bond_downdelay': ('django.db.models.fields.IntegerField', [], {'default': '200'}),
            'bond_miimon': ('django.db.models.fields.IntegerField', [], {'default': '100'}),
            'bond_mode': ('django.db.models.fields.CharField', [], {'default': "'active-backup'", 'max_length': '50'}),
            'bond_updelay': ('django.db.models.fields.IntegerField', [], {'default': '200'}),
            'brports': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'bridge_dev_set'", 'blank': 'True', 'to': "orm['ifconfig.NetDevice']"}),
            'devname': ('django.db.models.fields.CharField', [], {'max_length': '10'}),
            'dhcp': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'host': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.Host']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'jumbo': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'slaves': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'bond_dev_set'", 'blank': 'True', 'to': "orm['ifconfig.NetDevice']"}),
            'vlanrawdev': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'vlan_dev_set'", 'null': 'True', 'to': "orm['ifconfig.NetDevice']"})
        }
    }

    complete_apps = ['drbd']
