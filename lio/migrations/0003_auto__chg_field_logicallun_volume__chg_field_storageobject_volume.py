# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):

        # Changing field 'LogicalLUN.volume'
        db.alter_column('lio_logicallun', 'volume_id', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['volumes.BlockVolume'], unique=True))

        # Changing field 'StorageObject.volume'
        db.alter_column('lio_storageobject', 'volume_id', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['volumes.BlockVolume']))

    def backwards(self, orm):

        # Changing field 'LogicalLUN.volume'
        db.alter_column('lio_logicallun', 'volume_id', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.LogicalVolume'], unique=True))

        # Changing field 'StorageObject.volume'
        db.alter_column('lio_storageobject', 'volume_id', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.LogicalVolume']))

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
        'ifconfig.hostgroup': {
            'Meta': {'object_name': 'HostGroup'},
            'hosts': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['ifconfig.Host']", 'symmetrical': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'})
        },
        'ifconfig.ipaddress': {
            'Meta': {'object_name': 'IPAddress'},
            'address': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'configure': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'device': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.NetDevice']", 'null': 'True', 'blank': 'True'}),
            'domain': ('django.db.models.fields.CharField', [], {'max_length': '250', 'null': 'True', 'blank': 'True'}),
            'gateway': ('django.db.models.fields.CharField', [], {'max_length': '50', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'nameservers': ('django.db.models.fields.CharField', [], {'max_length': '50', 'null': 'True', 'blank': 'True'}),
            'primary_address': ('django.db.models.fields.BooleanField', [], {'default': 'False'})
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
        'lio.acl': {
            'Meta': {'unique_together': "[('tpg', 'initiator')]", 'object_name': 'ACL'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'initiator': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lio.Initiator']"}),
            'mapped_luns': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['lio.LUN']", 'symmetrical': 'False'}),
            'tpg': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lio.TPG']"})
        },
        'lio.backstore': {
            'Meta': {'unique_together': "[('store_id', 'host')]", 'object_name': 'Backstore'},
            'host': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.Host']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'store_id': ('django.db.models.fields.IntegerField', [], {}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '10'})
        },
        'lio.initiator': {
            'Meta': {'object_name': 'Initiator'},
            'host': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.Host']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '10'}),
            'wwn': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '250'})
        },
        'lio.logicallun': {
            'Meta': {'object_name': 'LogicalLUN'},
            'hostgroups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['ifconfig.HostGroup']", 'symmetrical': 'False'}),
            'hosts': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['ifconfig.Host']", 'symmetrical': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'targets': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['lio.Target']", 'symmetrical': 'False'}),
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['volumes.BlockVolume']", 'unique': 'True'})
        },
        'lio.lun': {
            'Meta': {'unique_together': "[('tpg', 'storageobj'), ('logicallun', 'storageobj'), ('logicallun', 'tpg')]", 'object_name': 'LUN'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'logicallun': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lio.LogicalLUN']", 'null': 'True', 'blank': 'True'}),
            'lun_id': ('django.db.models.fields.IntegerField', [], {}),
            'storageobj': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lio.StorageObject']"}),
            'tpg': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lio.TPG']"})
        },
        'lio.portal': {
            'Meta': {'unique_together': "[('ipaddress', 'port')]", 'object_name': 'Portal'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ipaddress': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.IPAddress']"}),
            'port': ('django.db.models.fields.IntegerField', [], {'default': '3260'})
        },
        'lio.storageobject': {
            'Meta': {'unique_together': "[('backstore', 'volume')]", 'object_name': 'StorageObject'},
            'backstore': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lio.Backstore']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['volumes.BlockVolume']"}),
            'wwn': ('django.db.models.fields.CharField', [], {'max_length': '250', 'blank': 'True'})
        },
        'lio.target': {
            'Meta': {'unique_together': "[('wwn', 'host')]", 'object_name': 'Target'},
            'host': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.Host']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'type': ('django.db.models.fields.CharField', [], {'max_length': '10'}),
            'wwn': ('django.db.models.fields.CharField', [], {'max_length': '250'})
        },
        'lio.tpg': {
            'Meta': {'unique_together': "[('tag', 'target')]", 'object_name': 'TPG'},
            'chapauth': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'portals': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['lio.Portal']", 'symmetrical': 'False'}),
            'tag': ('django.db.models.fields.IntegerField', [], {}),
            'target': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lio.Target']"})
        },
        'volumes.blockvolume': {
            'Meta': {'object_name': 'BlockVolume'},
            'capflags': ('django.db.models.fields.BigIntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'pool': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['volumes.VolumePool']", 'null': 'True', 'blank': 'True'}),
            'upper_id': ('django.db.models.fields.PositiveIntegerField', [], {'null': 'True', 'blank': 'True'}),
            'upper_type': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'blockvolume_upper_type_set'", 'null': 'True', 'to': "orm['contenttypes.ContentType']"}),
            'volume_type': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'blockvolume_volume_type_set'", 'null': 'True', 'to': "orm['contenttypes.ContentType']"})
        },
        'volumes.volumepool': {
            'Meta': {'object_name': 'VolumePool'},
            'capflags': ('django.db.models.fields.BigIntegerField', [], {'default': '0'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'volumepool_type': ('django.db.models.fields.related.ForeignKey', [], {'blank': 'True', 'related_name': "'volumepool_volumepool_type_set'", 'null': 'True', 'to': "orm['contenttypes.ContentType']"})
        }
    }

    complete_apps = ['lio']