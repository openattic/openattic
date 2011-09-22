# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import socket
import netifaces
import netaddr
import dbus

from django.conf import settings
from django.db import models

AF_CHOICES = (
    (socket.AF_INET,  "IPv4"),
    (socket.AF_INET6, "IPv6"),
    )

# balance-rr or 0
# active-backup or 1
# balance-xor or 2
# broadcast or 3
# 802.3ad or 4
# balance-tlb or 5
# balance-alb or 6

BOND_MODE_CHOICES = (
    ("balance-rr",     "balance-rr: Balanced Round Robin"),
    ("active-backup",  "active-backup: Failover"),
    ("balance-xor",    "balance-xor"),
    ("broadcast",      "broadcast"),
    ("802.3ad",        "802.3ad"),
    ("balance-tlb",    "balance-tlb"),
    ("balance-alb",    "balance-alb"),
    )


class NetDevice(models.Model):
    devname     = models.CharField(max_length=10, unique=True)
    auto        = models.BooleanField(default=True, blank=True)
    address     = models.CharField(max_length=250, unique=True, blank=True, null=True,
                    help_text='Enter a static IP address, "dhcp" or leave this field blank for ifaces without an IP.')
    gateway     = models.CharField(max_length=50, blank=True, null=True)
    nameservers = models.CharField(max_length=50, blank=True, null=True)
    domain      = models.CharField(max_length=250, blank=True, null=True)
    prefixlen   = models.IntegerField(default=24, blank=True, null=True)
    family      = models.IntegerField(default=socket.AF_INET, choices=AF_CHOICES, blank=True, null=True)
    slaves      = models.ManyToManyField('self', blank=True, symmetrical=False, related_name="bond_dev_set",
                    help_text="If this interface is a bonding device, add the slave devices here.")
    brports     = models.ManyToManyField('self', blank=True, symmetrical=False, related_name="bridge_dev_set",
                    help_text="If this interface is a bridge, add the ports here.")
    vlanrawdev  = models.ForeignKey('self', blank=True, null=True, related_name="vlan_dev_set",
                    help_text="If this interface is VLAN device, name the raw device here.")

    bond_mode      = models.CharField( max_length=50, default="active-backup", choices=BOND_MODE_CHOICES )
    bond_miimon    = models.IntegerField( default=100 )
    bond_downdelay = models.IntegerField( default=200 )
    bond_updelay   = models.IntegerField( default=200 )


    def __unicode__(self):
        return self.devname

    def get_addresses(self, af=None):
        addrs = []
        ifaddrs = netifaces.ifaddresses(iface)
        if af is None:
            if self.family:
                af = self.family
            else:
                af = (socket.AF_INET, socket.AF_INET6)
        for ifaddrfam in ifaddrs:
            for addrinfo in ifaddrs[ifaddrfam]:
                if ifaddrfam not in af or addrinfo["addr"] in addrs:
                    continue
                curaddr = netaddr.IPNetwork( "%s/%s" % ( addrinfo["addr"].split('%')[0], addrinfo["netmask"] ) )
                curaddr.iface  = iface
                curaddr.family = ifaddrfam

                addrs.append( curaddr )
        return addrs

    @classmethod
    def write_interfaces(self):
        ifconfig = dbus.SystemBus().get_object(settings.DBUS_IFACE_SYSTEMD, "/ifconfig")
        ifconfig.write_interfaces()


def get_addresses(af=None, loopback=False, linklocal=False, cluster=True):
    addrs = []

    if af is None:
        af = (socket.AF_INET, socket.AF_INET6)
    elif not isinstance(af, (tuple, list)):
        af = (af,)

    for iface in netifaces.interfaces():
        ifaddrs = netifaces.ifaddresses(iface)
        for ifaddrfam in ifaddrs:
            for addrinfo in ifaddrs[ifaddrfam]:
                if ifaddrfam not in af or addrinfo["addr"] in addrs:
                    continue
                curaddr = netaddr.IPNetwork( "%s/%s" % ( addrinfo["addr"].split('%')[0], addrinfo["netmask"] ) )
                curaddr.iface  = iface
                curaddr.family = ifaddrfam

                if not loopback  and curaddr.ip.is_loopback():
                    continue
                if not linklocal and curaddr.ip.is_link_local():
                    continue

                addrs.append( curaddr )

    if cluster:
        for claddr in ClusterAddr.objects.all():
            ipnet = netaddr.IPNetwork( "%s/%d" % ( claddr.address, claddr.prefixlen ) )
            ipnet.iface = "unknown"
            ipnet.family = claddr.family
            if ipnet not in addrs:
                addrs.append( ipnet )

    return addrs

def get_host_address(af=None, loopback=False, linklocal=False, cluster=True):
    hostaddrs = set([ netaddr.IPAddress(info[4][0]) for info in socket.getaddrinfo( socket.gethostname(), af ) ])
    for tryaddr in get_addresses(af, loopback, linklocal, cluster):
        if tryaddr.ip in hostaddrs:
            return tryaddr


def get_address_choices(af=None, loopback=False, linklocal=False, cluster=True):
    choices = []
    protonames = dict(AF_CHOICES)
    for addr in get_addresses(af, loopback, linklocal, cluster):
        choices.append(( str(addr.ip), "%s (%s, %s)" % (str(addr), protonames[addr.family], addr.iface) ))
    return choices

def get_network_choices(af=None, loopback=False, linklocal=False, cluster=True):
    choices = []
    protonames = dict(AF_CHOICES)
    for addr in get_addresses(af, loopback, linklocal, cluster):
        choices.append(( str(addr.network), "%s/%d (%s, %s)" % (
            str(addr.network), addr.prefixlen, protonames[addr.family], addr.iface
            ) ))
    return choices
