# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Backstore'
        db.create_table('lio_backstore', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('store_id', self.gf('django.db.models.fields.IntegerField')()),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=10)),
            ('host', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.Host'])),
        ))
        db.send_create_signal('lio', ['Backstore'])

        # Adding unique constraint on 'Backstore', fields ['store_id', 'host']
        db.create_unique('lio_backstore', ['store_id', 'host_id'])

        # Adding model 'StorageObject'
        db.create_table('lio_storageobject', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('backstore', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lio.Backstore'])),
            ('volume', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.LogicalVolume'])),
            ('wwn', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
        ))
        db.send_create_signal('lio', ['StorageObject'])

        # Adding unique constraint on 'StorageObject', fields ['backstore', 'volume']
        db.create_unique('lio_storageobject', ['backstore_id', 'volume_id'])

        # Adding model 'Target'
        db.create_table('lio_target', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('wwn', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=10)),
            ('host', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.Host'])),
        ))
        db.send_create_signal('lio', ['Target'])

        # Adding unique constraint on 'Target', fields ['wwn', 'host']
        db.create_unique('lio_target', ['wwn', 'host_id'])

        # Adding model 'Initiator'
        db.create_table('lio_initiator', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('host', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.Host'])),
            ('wwn', self.gf('django.db.models.fields.CharField')(unique=True, max_length=250)),
            ('type', self.gf('django.db.models.fields.CharField')(max_length=10)),
        ))
        db.send_create_signal('lio', ['Initiator'])

        # Adding model 'Portal'
        db.create_table('lio_portal', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('ipaddress', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.IPAddress'])),
            ('port', self.gf('django.db.models.fields.IntegerField')(default=3260)),
        ))
        db.send_create_signal('lio', ['Portal'])

        # Adding unique constraint on 'Portal', fields ['ipaddress', 'port']
        db.create_unique('lio_portal', ['ipaddress_id', 'port'])

        # Adding model 'TPG'
        db.create_table('lio_tpg', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('tag', self.gf('django.db.models.fields.IntegerField')()),
            ('target', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lio.Target'])),
            ('chapauth', self.gf('django.db.models.fields.BooleanField')(default=False)),
        ))
        db.send_create_signal('lio', ['TPG'])

        # Adding unique constraint on 'TPG', fields ['tag', 'target']
        db.create_unique('lio_tpg', ['tag', 'target_id'])

        # Adding M2M table for field portals on 'TPG'
        db.create_table('lio_tpg_portals', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('tpg', models.ForeignKey(orm['lio.tpg'], null=False)),
            ('portal', models.ForeignKey(orm['lio.portal'], null=False))
        ))
        db.create_unique('lio_tpg_portals', ['tpg_id', 'portal_id'])

        # Adding model 'LUN'
        db.create_table('lio_lun', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('tpg', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lio.TPG'])),
            ('storageobj', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lio.StorageObject'])),
            ('lun_id', self.gf('django.db.models.fields.IntegerField')()),
            ('logicallun', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lio.LogicalLUN'], null=True, blank=True)),
        ))
        db.send_create_signal('lio', ['LUN'])

        # Adding unique constraint on 'LUN', fields ['tpg', 'storageobj']
        db.create_unique('lio_lun', ['tpg_id', 'storageobj_id'])

        # Adding unique constraint on 'LUN', fields ['logicallun', 'storageobj']
        db.create_unique('lio_lun', ['logicallun_id', 'storageobj_id'])

        # Adding unique constraint on 'LUN', fields ['logicallun', 'tpg']
        db.create_unique('lio_lun', ['logicallun_id', 'tpg_id'])

        # Adding model 'ACL'
        db.create_table('lio_acl', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('tpg', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lio.TPG'])),
            ('initiator', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lio.Initiator'])),
        ))
        db.send_create_signal('lio', ['ACL'])

        # Adding unique constraint on 'ACL', fields ['tpg', 'initiator']
        db.create_unique('lio_acl', ['tpg_id', 'initiator_id'])

        # Adding M2M table for field mapped_luns on 'ACL'
        db.create_table('lio_acl_mapped_luns', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('acl', models.ForeignKey(orm['lio.acl'], null=False)),
            ('lun', models.ForeignKey(orm['lio.lun'], null=False))
        ))
        db.create_unique('lio_acl_mapped_luns', ['acl_id', 'lun_id'])

        # Adding model 'LogicalLUN'
        db.create_table('lio_logicallun', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('volume', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.LogicalVolume'], unique=True)),
            ('lun_id', self.gf('django.db.models.fields.IntegerField')(unique=True)),
        ))
        db.send_create_signal('lio', ['LogicalLUN'])

        # Adding M2M table for field hostgroups on 'LogicalLUN'
        db.create_table('lio_logicallun_hostgroups', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('logicallun', models.ForeignKey(orm['lio.logicallun'], null=False)),
            ('hostgroup', models.ForeignKey(orm['ifconfig.hostgroup'], null=False))
        ))
        db.create_unique('lio_logicallun_hostgroups', ['logicallun_id', 'hostgroup_id'])

        # Adding M2M table for field hosts on 'LogicalLUN'
        db.create_table('lio_logicallun_hosts', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('logicallun', models.ForeignKey(orm['lio.logicallun'], null=False)),
            ('host', models.ForeignKey(orm['ifconfig.host'], null=False))
        ))
        db.create_unique('lio_logicallun_hosts', ['logicallun_id', 'host_id'])

        # Adding M2M table for field targets on 'LogicalLUN'
        db.create_table('lio_logicallun_targets', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('logicallun', models.ForeignKey(orm['lio.logicallun'], null=False)),
            ('target', models.ForeignKey(orm['lio.target'], null=False))
        ))
        db.create_unique('lio_logicallun_targets', ['logicallun_id', 'target_id'])


    def backwards(self, orm):
        # Removing unique constraint on 'ACL', fields ['tpg', 'initiator']
        db.delete_unique('lio_acl', ['tpg_id', 'initiator_id'])

        # Removing unique constraint on 'LUN', fields ['logicallun', 'tpg']
        db.delete_unique('lio_lun', ['logicallun_id', 'tpg_id'])

        # Removing unique constraint on 'LUN', fields ['logicallun', 'storageobj']
        db.delete_unique('lio_lun', ['logicallun_id', 'storageobj_id'])

        # Removing unique constraint on 'LUN', fields ['tpg', 'storageobj']
        db.delete_unique('lio_lun', ['tpg_id', 'storageobj_id'])

        # Removing unique constraint on 'TPG', fields ['tag', 'target']
        db.delete_unique('lio_tpg', ['tag', 'target_id'])

        # Removing unique constraint on 'Portal', fields ['ipaddress', 'port']
        db.delete_unique('lio_portal', ['ipaddress_id', 'port'])

        # Removing unique constraint on 'Target', fields ['wwn', 'host']
        db.delete_unique('lio_target', ['wwn', 'host_id'])

        # Removing unique constraint on 'StorageObject', fields ['backstore', 'volume']
        db.delete_unique('lio_storageobject', ['backstore_id', 'volume_id'])

        # Removing unique constraint on 'Backstore', fields ['store_id', 'host']
        db.delete_unique('lio_backstore', ['store_id', 'host_id'])

        # Deleting model 'Backstore'
        db.delete_table('lio_backstore')

        # Deleting model 'StorageObject'
        db.delete_table('lio_storageobject')

        # Deleting model 'Target'
        db.delete_table('lio_target')

        # Deleting model 'Initiator'
        db.delete_table('lio_initiator')

        # Deleting model 'Portal'
        db.delete_table('lio_portal')

        # Deleting model 'TPG'
        db.delete_table('lio_tpg')

        # Removing M2M table for field portals on 'TPG'
        db.delete_table('lio_tpg_portals')

        # Deleting model 'LUN'
        db.delete_table('lio_lun')

        # Deleting model 'ACL'
        db.delete_table('lio_acl')

        # Removing M2M table for field mapped_luns on 'ACL'
        db.delete_table('lio_acl_mapped_luns')

        # Deleting model 'LogicalLUN'
        db.delete_table('lio_logicallun')

        # Removing M2M table for field hostgroups on 'LogicalLUN'
        db.delete_table('lio_logicallun_hostgroups')

        # Removing M2M table for field hosts on 'LogicalLUN'
        db.delete_table('lio_logicallun_hosts')

        # Removing M2M table for field targets on 'LogicalLUN'
        db.delete_table('lio_logicallun_targets')


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
            'lun_id': ('django.db.models.fields.IntegerField', [], {'unique': 'True'}),
            'targets': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['lio.Target']", 'symmetrical': 'False'}),
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.LogicalVolume']", 'unique': 'True'})
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
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.LogicalVolume']"}),
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

    complete_apps = ['lio']