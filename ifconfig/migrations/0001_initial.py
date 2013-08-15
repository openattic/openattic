# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Host'
        db.create_table('ifconfig_host', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=63)),
        ))
        db.send_create_signal('ifconfig', ['Host'])

        # Adding model 'HostGroup'
        db.create_table('ifconfig_hostgroup', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=250)),
        ))
        db.send_create_signal('ifconfig', ['HostGroup'])

        # Adding M2M table for field hosts on 'HostGroup'
        db.create_table('ifconfig_hostgroup_hosts', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('hostgroup', models.ForeignKey(orm['ifconfig.hostgroup'], null=False)),
            ('host', models.ForeignKey(orm['ifconfig.host'], null=False))
        ))
        db.create_unique('ifconfig_hostgroup_hosts', ['hostgroup_id', 'host_id'])

        # Adding model 'NetDevice'
        db.create_table('ifconfig_netdevice', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('host', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.Host'])),
            ('devname', self.gf('django.db.models.fields.CharField')(max_length=10)),
            ('dhcp', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('auto', self.gf('django.db.models.fields.BooleanField')(default=True)),
            ('jumbo', self.gf('django.db.models.fields.BooleanField')(default=False)),
            ('vlanrawdev', self.gf('django.db.models.fields.related.ForeignKey')(blank=True, related_name='vlan_dev_set', null=True, to=orm['ifconfig.NetDevice'])),
            ('bond_mode', self.gf('django.db.models.fields.CharField')(default='active-backup', max_length=50)),
            ('bond_miimon', self.gf('django.db.models.fields.IntegerField')(default=100)),
            ('bond_downdelay', self.gf('django.db.models.fields.IntegerField')(default=200)),
            ('bond_updelay', self.gf('django.db.models.fields.IntegerField')(default=200)),
        ))
        db.send_create_signal('ifconfig', ['NetDevice'])

        # Adding unique constraint on 'NetDevice', fields ['host', 'devname']
        db.create_unique('ifconfig_netdevice', ['host_id', 'devname'])

        # Adding M2M table for field slaves on 'NetDevice'
        db.create_table('ifconfig_netdevice_slaves', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('from_netdevice', models.ForeignKey(orm['ifconfig.netdevice'], null=False)),
            ('to_netdevice', models.ForeignKey(orm['ifconfig.netdevice'], null=False))
        ))
        db.create_unique('ifconfig_netdevice_slaves', ['from_netdevice_id', 'to_netdevice_id'])

        # Adding M2M table for field brports on 'NetDevice'
        db.create_table('ifconfig_netdevice_brports', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('from_netdevice', models.ForeignKey(orm['ifconfig.netdevice'], null=False)),
            ('to_netdevice', models.ForeignKey(orm['ifconfig.netdevice'], null=False))
        ))
        db.create_unique('ifconfig_netdevice_brports', ['from_netdevice_id', 'to_netdevice_id'])

        # Adding model 'IPAddress'
        db.create_table('ifconfig_ipaddress', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('address', self.gf('django.db.models.fields.CharField')(max_length=250)),
            ('gateway', self.gf('django.db.models.fields.CharField')(max_length=50, blank=True)),
            ('nameservers', self.gf('django.db.models.fields.CharField')(max_length=50, null=True, blank=True)),
            ('domain', self.gf('django.db.models.fields.CharField')(max_length=250, null=True, blank=True)),
            ('device', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.NetDevice'], null=True, blank=True)),
            ('configure', self.gf('django.db.models.fields.BooleanField')(default=True)),
        ))
        db.send_create_signal('ifconfig', ['IPAddress'])


    def backwards(self, orm):
        # Removing unique constraint on 'NetDevice', fields ['host', 'devname']
        db.delete_unique('ifconfig_netdevice', ['host_id', 'devname'])

        # Deleting model 'Host'
        db.delete_table('ifconfig_host')

        # Deleting model 'HostGroup'
        db.delete_table('ifconfig_hostgroup')

        # Removing M2M table for field hosts on 'HostGroup'
        db.delete_table('ifconfig_hostgroup_hosts')

        # Deleting model 'NetDevice'
        db.delete_table('ifconfig_netdevice')

        # Removing M2M table for field slaves on 'NetDevice'
        db.delete_table('ifconfig_netdevice_slaves')

        # Removing M2M table for field brports on 'NetDevice'
        db.delete_table('ifconfig_netdevice_brports')

        # Deleting model 'IPAddress'
        db.delete_table('ifconfig_ipaddress')


    models = {
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
        }
    }

    complete_apps = ['ifconfig']