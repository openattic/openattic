# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Initiator'
        db.create_table('iscsi_initiator', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=50)),
            ('address', self.gf('django.db.models.fields.CharField')(unique=True, max_length=250)),
            ('peer', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['peering.PeerHost'], null=True, blank=True)),
        ))
        db.send_create_signal('iscsi', ['Initiator'])

        # Adding model 'Target'
        db.create_table('iscsi_target', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('iscsiname', self.gf('django.db.models.fields.CharField')(max_length=250)),
        ))
        db.send_create_signal('iscsi', ['Target'])

        # Adding M2M table for field init_allow on 'Target'
        db.create_table('iscsi_target_init_allow', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('target', models.ForeignKey(orm['iscsi.target'], null=False)),
            ('initiator', models.ForeignKey(orm['iscsi.initiator'], null=False))
        ))
        db.create_unique('iscsi_target_init_allow', ['target_id', 'initiator_id'])

        # Adding M2M table for field init_deny on 'Target'
        db.create_table('iscsi_target_init_deny', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('target', models.ForeignKey(orm['iscsi.target'], null=False)),
            ('initiator', models.ForeignKey(orm['iscsi.initiator'], null=False))
        ))
        db.create_unique('iscsi_target_init_deny', ['target_id', 'initiator_id'])

        # Adding M2M table for field tgt_allow on 'Target'
        db.create_table('iscsi_target_tgt_allow', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('target', models.ForeignKey(orm['iscsi.target'], null=False)),
            ('ipaddress', models.ForeignKey(orm['ifconfig.ipaddress'], null=False))
        ))
        db.create_unique('iscsi_target_tgt_allow', ['target_id', 'ipaddress_id'])

        # Adding model 'Lun'
        db.create_table('iscsi_lun', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('target', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['iscsi.Target'])),
            ('volume', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['lvm.LogicalVolume'])),
            ('number', self.gf('django.db.models.fields.IntegerField')(default=-1)),
            ('alias', self.gf('django.db.models.fields.CharField')(max_length=20, blank=True)),
            ('ltype', self.gf('django.db.models.fields.CharField')(default='fileio', max_length=10)),
        ))
        db.send_create_signal('iscsi', ['Lun'])

        # Adding unique constraint on 'Lun', fields ['target', 'number']
        db.create_unique('iscsi_lun', ['target_id', 'number'])

        # Adding model 'ChapUser'
        db.create_table('iscsi_chapuser', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('target', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['iscsi.Target'])),
            ('username', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('passwd', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('usertype', self.gf('django.db.models.fields.CharField')(max_length=50)),
        ))
        db.send_create_signal('iscsi', ['ChapUser'])

        # Adding unique constraint on 'ChapUser', fields ['target', 'username', 'usertype']
        db.create_unique('iscsi_chapuser', ['target_id', 'username', 'usertype'])


    def backwards(self, orm):
        # Removing unique constraint on 'ChapUser', fields ['target', 'username', 'usertype']
        db.delete_unique('iscsi_chapuser', ['target_id', 'username', 'usertype'])

        # Removing unique constraint on 'Lun', fields ['target', 'number']
        db.delete_unique('iscsi_lun', ['target_id', 'number'])

        # Deleting model 'Initiator'
        db.delete_table('iscsi_initiator')

        # Deleting model 'Target'
        db.delete_table('iscsi_target')

        # Removing M2M table for field init_allow on 'Target'
        db.delete_table('iscsi_target_init_allow')

        # Removing M2M table for field init_deny on 'Target'
        db.delete_table('iscsi_target_init_deny')

        # Removing M2M table for field tgt_allow on 'Target'
        db.delete_table('iscsi_target_tgt_allow')

        # Deleting model 'Lun'
        db.delete_table('iscsi_lun')

        # Deleting model 'ChapUser'
        db.delete_table('iscsi_chapuser')


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
        'iscsi.chapuser': {
            'Meta': {'unique_together': "[('target', 'username', 'usertype')]", 'object_name': 'ChapUser'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'passwd': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'target': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['iscsi.Target']"}),
            'username': ('django.db.models.fields.CharField', [], {'max_length': '50'}),
            'usertype': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'iscsi.initiator': {
            'Meta': {'object_name': 'Initiator'},
            'address': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '250'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '50'}),
            'peer': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['peering.PeerHost']", 'null': 'True', 'blank': 'True'})
        },
        'iscsi.lun': {
            'Meta': {'unique_together': "[('target', 'number')]", 'object_name': 'Lun'},
            'alias': ('django.db.models.fields.CharField', [], {'max_length': '20', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ltype': ('django.db.models.fields.CharField', [], {'default': "'fileio'", 'max_length': '10'}),
            'number': ('django.db.models.fields.IntegerField', [], {'default': '-1'}),
            'target': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['iscsi.Target']"}),
            'volume': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['lvm.LogicalVolume']"})
        },
        'iscsi.target': {
            'Meta': {'object_name': 'Target'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'init_allow': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'allowed_targets'", 'blank': 'True', 'to': "orm['iscsi.Initiator']"}),
            'init_deny': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'denied_targets'", 'blank': 'True', 'to': "orm['iscsi.Initiator']"}),
            'iscsiname': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '250'}),
            'tgt_allow': ('django.db.models.fields.related.ManyToManyField', [], {'symmetrical': 'False', 'related_name': "'allowed_targets'", 'blank': 'True', 'to': "orm['ifconfig.IPAddress']"})
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
        },
        'peering.peerhost': {
            'Meta': {'object_name': 'PeerHost'},
            'base_url': ('peering.models.PeerUrlField', [], {'max_length': '250'}),
            'clusterpeer': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'host': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['ifconfig.Host']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'})
        }
    }

    complete_apps = ['iscsi']