# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Deleting model 'Connection'
        db.delete_table('drbd_connection')

        # Deleting model 'Endpoint'
        db.delete_table('drbd_endpoint')


    def backwards(self, orm):
        # Adding model 'Connection'
        db.create_table('drbd_connection', (
            ('sb_2pri', self.gf('django.db.models.fields.CharField')(default='disconnect', max_length=25)),
            ('wfc_timeout', self.gf('django.db.models.fields.IntegerField')(default=10, null=True, blank=True)),
            ('stack_parent', self.gf('django.db.models.fields.related.ForeignKey')(related_name='stack_child_set', null=True, to=orm['drbd.Connection'], blank=True)),
            ('protocol', self.gf('django.db.models.fields.CharField')(default='C', max_length=1)),
            ('syncer_rate', self.gf('django.db.models.fields.CharField')(default='5M', max_length=25, blank=True)),
            ('outdated_wfc_timeout', self.gf('django.db.models.fields.IntegerField')(default=15, null=True, blank=True)),
            ('fencing', self.gf('django.db.models.fields.CharField')(default='dont-care', max_length=25)),
            ('cram_hmac_alg', self.gf('django.db.models.fields.CharField')(default='sha1', max_length=25)),
            ('on_io_error', self.gf('django.db.models.fields.CharField')(default='detach', max_length=25)),
            ('sb_1pri', self.gf('django.db.models.fields.CharField')(default='discard-secondary', max_length=25)),
            ('res_name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('secret', self.gf('django.db.models.fields.CharField')(max_length=250, blank=True)),
            ('degr_wfc_timeout', self.gf('django.db.models.fields.IntegerField')(default=120, null=True, blank=True)),
            ('sb_0pri', self.gf('django.db.models.fields.CharField')(default='discard-younger-primary', max_length=25)),
            ('ipaddress', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.IPAddress'], null=True, blank=True)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal('drbd', ['Connection'])

        # Adding model 'Endpoint'
        db.create_table('drbd_endpoint', (
            ('connection', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['drbd.Connection'])),
            ('ipaddress', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['ifconfig.IPAddress'])),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
        ))
        db.send_create_signal('drbd', ['Endpoint'])


    models = {
        
    }

    complete_apps = ['drbd']