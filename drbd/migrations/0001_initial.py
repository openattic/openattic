# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Connection'
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
            ('volume', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.LogicalVolume'])),
            ('ordering', self.gf('django.db.models.fields.IntegerField')(default=0)),
            ('connection', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['drbd.Connection'])),
            ('ipaddress', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.IPAddress'])),
        ))
        db.send_create_signal('drbd', ['Endpoint'])

        # Adding unique constraint on 'Endpoint', fields ['volume', 'ordering']
        db.create_unique('drbd_endpoint', ['volume_id', 'ordering'])


    def backwards(self, orm):
        # Removing unique constraint on 'Endpoint', fields ['volume', 'ordering']
        db.delete_unique('drbd_endpoint', ['volume_id', 'ordering'])

        # Deleting model 'Connection'
        db.delete_table('drbd_connection')

        # Deleting model 'Endpoint'
        db.delete_table('drbd_endpoint')


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
            'Meta': {'unique_together': "(('volume', 'ordering'),)", 'object_name': 'Endpoint'},
            'connection': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['drbd.Connection']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ipaddress': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.IPAddress']"}),
            'ordering': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.LogicalVolume']"})
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
        },
        'lvm.logicalvolume': {
            'Meta': {'unique_together': "(('vg', 'name'),)", 'object_name': 'LogicalVolume'},
            'compression': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'createdate': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'null': 'True', 'blank': 'True'}),
            'dedup': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'filesystem': ('django.db.models.fields.CharField', [], {'max_length': '20', 'blank': 'True'}),
            'formatted': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'fscritical': ('django.db.models.fields.IntegerField', [], {'default': '85'}),
            'fswarning': ('django.db.models.fields.IntegerField', [], {'default': '75'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'megs': ('django.db.models.fields.IntegerField', [], {}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '130'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']", 'blank': 'True'}),
            'snapshot': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'snapshot_set'", 'null': 'True', 'to': "orm['lvm.LogicalVolume']"}),
            'snapshotconf': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'snapshot_set'", 'null': 'True', 'to': "orm['lvm.SnapshotConf']"}),
            'uuid': ('django.db.models.fields.CharField', [], {'max_length': '38', 'blank': 'True'}),
            'vg': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.VolumeGroup']", 'blank': 'True'})
        },
        'lvm.snapshotconf': {
            'Meta': {'object_name': 'SnapshotConf'},
            'confname': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'last_execution': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'postscript': ('django.db.models.fields.CharField', [], {'max_length': '225', 'null': 'True'}),
            'prescript': ('django.db.models.fields.CharField', [], {'max_length': '255', 'null': 'True'}),
            'retention_time': ('django.db.models.fields.IntegerField', [], {'null': 'True', 'blank': 'True'})
        },
        'lvm.volumegroup': {
            'Meta': {'object_name': 'VolumeGroup'},
            'host': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.Host']", 'null': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '130'})
        }
    }

    complete_apps = ['drbd']