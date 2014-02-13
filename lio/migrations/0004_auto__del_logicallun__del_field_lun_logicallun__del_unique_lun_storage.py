# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Removing unique constraint on 'LUN', fields ['tpg', 'logicallun']
        db.delete_unique('lio_lun', ['tpg_id', 'logicallun_id'])

        # Removing unique constraint on 'LUN', fields ['storageobj', 'logicallun']
        db.delete_unique('lio_lun', ['storageobj_id', 'logicallun_id'])

        # Deleting model 'LogicalLUN'
        db.delete_table('lio_logicallun')

        # Removing M2M table for field hostgroups on 'LogicalLUN'
        db.delete_table('lio_logicallun_hostgroups')

        # Removing M2M table for field targets on 'LogicalLUN'
        db.delete_table('lio_logicallun_targets')

        # Removing M2M table for field hosts on 'LogicalLUN'
        db.delete_table('lio_logicallun_hosts')

        # Deleting field 'LUN.logicallun'
        db.delete_column('lio_lun', 'logicallun_id')


    def backwards(self, orm):
        # Adding model 'LogicalLUN'
        db.create_table('lio_logicallun', (
            ('volume', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['volumes.BlockVolume'], unique=True)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal('lio', ['LogicalLUN'])

        # Adding M2M table for field hostgroups on 'LogicalLUN'
        db.create_table('lio_logicallun_hostgroups', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('logicallun', models.ForeignKey(orm['lio.logicallun'], null=False)),
            ('hostgroup', models.ForeignKey(orm['ifconfig.hostgroup'], null=False))
        ))
        db.create_unique('lio_logicallun_hostgroups', ['logicallun_id', 'hostgroup_id'])

        # Adding M2M table for field targets on 'LogicalLUN'
        db.create_table('lio_logicallun_targets', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('logicallun', models.ForeignKey(orm['lio.logicallun'], null=False)),
            ('target', models.ForeignKey(orm['lio.target'], null=False))
        ))
        db.create_unique('lio_logicallun_targets', ['logicallun_id', 'target_id'])

        # Adding M2M table for field hosts on 'LogicalLUN'
        db.create_table('lio_logicallun_hosts', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('logicallun', models.ForeignKey(orm['lio.logicallun'], null=False)),
            ('host', models.ForeignKey(orm['ifconfig.host'], null=False))
        ))
        db.create_unique('lio_logicallun_hosts', ['logicallun_id', 'host_id'])

        # Adding field 'LUN.logicallun'
        db.add_column('lio_lun', 'logicallun',
                      self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lio.LogicalLUN'], null=True, blank=True),
                      keep_default=False)

        # Adding unique constraint on 'LUN', fields ['storageobj', 'logicallun']
        db.create_unique('lio_lun', ['storageobj_id', 'logicallun_id'])

        # Adding unique constraint on 'LUN', fields ['tpg', 'logicallun']
        db.create_unique('lio_lun', ['tpg_id', 'logicallun_id'])


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
        'lio.lun': {
            'Meta': {'unique_together': "[('tpg', 'storageobj')]", 'object_name': 'LUN'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
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