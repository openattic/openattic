# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Host',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True,
                                        primary_key=True)),
                ('name', models.CharField(unique=True, max_length=63)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='HostGroup',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True,
                                        primary_key=True)),
                ('name', models.CharField(max_length=250)),
                ('hosts', models.ManyToManyField(to='ifconfig.Host')),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='IPAddress',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True,
                                        primary_key=True)),
                ('address', models.CharField(max_length=250)),
                ('gateway', models.CharField(max_length=50, blank=True)),
                ('nameservers', models.CharField(max_length=50, null=True, blank=True)),
                ('domain', models.CharField(max_length=250, null=True, blank=True)),
                ('configure', models.BooleanField(default=True)),
                ('primary_address', models.BooleanField(default=False)),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='NetDevice',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True,
                                        primary_key=True)),
                ('devname', models.CharField(max_length=10)),
                ('dhcp', models.BooleanField(default=False)),
                ('auto', models.BooleanField(default=True)),
                ('jumbo', models.BooleanField(default=False)),
                ('bond_mode', models.CharField(default=b'active-backup', max_length=50,
                                               choices=[(b'balance-rr',
                                                         b'balance-rr: Balanced Round Robin'),
                                                        (b'active-backup',
                                                         b'active-backup: Failover'),
                                                        (b'balance-xor', b'balance-xor'),
                                                        (b'broadcast', b'broadcast'),
                                                        (b'802.3ad', b'802.3ad'),
                                                        (b'balance-tlb', b'balance-tlb'),
                                                        (b'balance-alb', b'balance-alb')])),
                ('bond_miimon', models.IntegerField(default=100)),
                ('bond_downdelay', models.IntegerField(default=200)),
                ('bond_updelay', models.IntegerField(default=200)),
                ('brports', models.ManyToManyField(help_text=b'If this interface is a bridge, add '
                                                             b'the ports here.',
                                                   related_name='bridge_dev_set',
                                                   to='ifconfig.NetDevice',
                                                   blank=True)),
                ('host', models.ForeignKey(to='ifconfig.Host')),
                ('slaves', models.ManyToManyField(help_text=b'If this interface is a bonding '
                                                            b'device, add the slave devices here.',
                                                  related_name='bond_dev_set',
                                                  to='ifconfig.NetDevice', blank=True)),
                ('vlanrawdev', models.ForeignKey(related_name='vlan_dev_set', blank=True,
                                                 to='ifconfig.NetDevice',
                                                 help_text=b'If this interface is VLAN device, '
                                                           b'name the raw device here.', null=True
                                                 )),
            ],
            options={
            },
            bases=(models.Model,),
        ),
        migrations.AlterUniqueTogether(
            name='netdevice',
            unique_together=set([('host', 'devname')]),
        ),
        migrations.AddField(
            model_name='ipaddress',
            name='device',
            field=models.ForeignKey(blank=True, to='ifconfig.NetDevice', null=True),
            preserve_default=True,
        ),
    ]
