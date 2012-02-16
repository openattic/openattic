# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import socket
import netifaces
import netaddr
import dbus

from os.path import join, exists

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


class IPAddress(models.Model):
    address     = models.CharField(max_length=250, unique=True)
    gateway     = models.CharField(max_length=50, blank=True)
    nameservers = models.CharField(max_length=50, blank=True, null=True)
    domain      = models.CharField(max_length=250, blank=True, null=True)
    device      = models.ForeignKey("NetDevice", blank=True, null=True)
    configure   = models.BooleanField(blank=True, default=True)

    @property
    def in_use(self):
        for relobj in ( self._meta.get_all_related_objects() + self._meta.get_all_related_many_to_many_objects() ):
            if relobj.model.objects.filter( **{ relobj.field.name: self } ).count() > 0:
                return True
        return False

    @property
    def is_loopback(self):
        return self.host_part in ("loopback", "localhost", "127.0.0.1", "::1")

    @property
    def is_ipv6(self):
        return ":" in self.address

    @property
    def host_part(self):
        return self.address.split("/")[0]


def statfile(devname, fname):
    fpath = join("/sys/class/net", devname, fname)
    if exists(fpath):
        try:
            with open(fpath, "rb") as fd:
                return fd.read().strip()
        except IOError, err:
            if err.errno == 22:
                return None
            raise
    else:
        return None

class NetDevice(models.Model):
    devname     = models.CharField(max_length=10, unique=True)
    dhcp        = models.BooleanField(default=False, blank=True)
    auto        = models.BooleanField(default=True, blank=True)
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

    @classmethod
    def get_root_devices(cls):
        rootdevs = list(NetDevice.objects.filter(slaves__isnull=False).distinct())
        rootdevs.extend(filter(
            lambda dev: dev.devtype == "native" and NetDevice.objects.filter(slaves__devname=dev.devname).count() == 0,
            NetDevice.objects.all()
            ))
        return rootdevs

    @classmethod
    def validate_config(cls):
        """ Validate the current configuration. """
        haveaddr = False
        havegw   = False
        havedns  = False
        havedomain = False

        for interface in NetDevice.objects.all():
            if interface.childdevs and interface.ipaddress_set.filter(configure=True).count() > 0:
                    raise ValueError("Interface %s has children and has an address" % interface.devname)

            if interface.dhcp:
                if interface.ipaddress_set.filter(configure=True).count() > 0:
                    raise ValueError("Interface %s uses DHCP but has an address" % interface.devname)
                haveaddr = True
                havegw   = True
                havedns  = True
                havedomain = True

            elif interface.ipaddress_set.filter(configure=True).count() > 0:
                for address in interface.ipaddress_set.filter(configure=True):
                    if not address.is_loopback:
                        addr = address.address.split("/")
                        haveaddr = True
                        if len(addr) == 1:
                            raise ValueError("Interface %s has an address without a netmask" % virtname)
                        if address.gateway:
                            havegw = True
                        if address.domain:
                            havedomain = True
                        if address.nameservers:
                            havedns = True

            if interface.vlanrawdev:
                base = interface.vlanrawdev
                if base == interface:
                    raise ValueError("Vlan %s has ITSELF as its base interface" % interface.devname)

            if interface.brports.all().count():
                if interface.brports.filter(id=interface.id).count():
                    raise ValueError("Bridge %s has ITSELF as one of its ports" % interface.devname)

            if interface.slaves.count():
                if interface.slaves.filter(id=interface.id).count():
                    raise ValueError("Bonding %s has ITSELF as one of its slaves" % interface.devname)

        if not haveaddr:
            raise ValueError("There is no interface that has an IP (none with dhcp and none with static address).")

        if not havegw:
            raise ValueError("There is no default gateway.")

        if not havedns:
            raise ValueError("There is are no name servers configured.")

        if not havedomain:
            raise ValueError("There is no domain configured.")

        return True

    @property
    def basedevs(self):
        """ Devices required for ``self`` to operate. """
        if self.devtype == "native":
            return []
        elif self.devtype == "bonding":
            return list(self.slaves.all())
        elif self.devtype == "bridge":
            return list(self.brports.all())
        else:
            return [self.vlanrawdev]

    @property
    def childdevs(self):
        """ Devices that require ``self`` to operate. """
        children = list(NetDevice.objects.filter(brports__devname=self.devname))
        children.extend(list(NetDevice.objects.filter(slaves__devname=self.devname)))
        children.extend(list(NetDevice.objects.filter(vlanrawdev__devname=self.devname)))
        return children

    @property
    def in_use(self):
        for dev in self.childdevs:
            if dev.in_use:
                return True
        for addr in self.ipaddress_set.all():
            if addr.in_use:
                return True
        return False

    @property
    def devtype(self):
        if self.vlanrawdev is not None:
            return "vlan"
        if self.brports.count():
            return "bridge"
        if self.slaves.count():
            return "bonding"
        return "native"

    @property
    def operstate(self):
        if self.devname == "lo":
            return None
        return statfile( self.devname, "operstate" ) == 'up'

    @property
    def carrier(self):
        if self.operstate == False:
            return None
        return statfile( self.devname, "carrier" ) == '1'

    @property
    def macaddress(self):
        return statfile( self.devname, "address" )

    @property
    def mtu(self):
        mtu = statfile( self.devname, "mtu" )
        if mtu is None:
            return None
        return int( mtu )

    @property
    def speed(self):
        if self.devname == "lo":
            return None
        elif self.devtype == "native":
            if not self.operstate:
                return None
            speed = statfile( self.devname, "speed" )
            if speed is None:
                return None
            return int( speed )
        else:
            if self.vlanrawdev:
                return self.vlanrawdev.speed

            if self.brports.all().count():
                return min( [ port.speed for port in self.brports.all() ] )

            if self.slaves.count():
                return min( [ slave.speed for slave in self.slaves.all() ] )
        raise ValueError("Speed could not be determined")

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
