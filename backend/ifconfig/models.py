# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""

import socket
import netifaces
import netaddr

from os.path import join, exists

from django.conf import settings
from django.db import models
from django.db.models import signals
from django.utils.translation import ugettext_noop as _

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
    ("balance-rr",     _("balance-rr: Balanced Round Robin")),
    ("active-backup",  _("active-backup: Failover")),
    ("balance-xor",    _("balance-xor")),
    ("broadcast",      _("broadcast")),
    ("802.3ad",        _("802.3ad")),
    ("balance-tlb",    _("balance-tlb")),
    ("balance-alb",    _("balance-alb")),
    )


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


class HostManager(models.Manager):
    def get_current(self):
        try:
            return self.get(name=socket.getfqdn())
        except Host.DoesNotExist:
            try:
                return self.get(name=socket.gethostname())
            except Host.DoesNotExist:
                if not self.exists():  # The Hosts model is empty.
                    return Host.insert_current_host()
                else:
                    raise


class Host(models.Model):
    name = models.CharField(max_length=63, unique=True)
    is_oa_host = models.NullBooleanField()

    objects = HostManager()

    def __unicode__(self):
        return self.name

    @property
    def hostname(self):
        return self.name.split('.')[0]

    def get_primary_ip_address_speed(self):
        ipaddress = IPAddress.all_objects.filter(primary_address=True, device__host=self)
        if len(ipaddress) == 1:
            return ipaddress[0].device.speed

    def get_primary_ip_address(self):
        return IPAddress.all_objects.get(primary_address=True, device__host=self)

    @property
    def installed_apps(self):
        if self.is_oa_host:
            return settings.INSTALLED_APPS

    @staticmethod
    def insert_current_host():
        fqdn = socket.getfqdn()
        host = Host(name=fqdn, is_oa_host=True)
        host.save()
        return host


class HostDependentQuerySet(models.query.QuerySet):
    def iterator(self):
        currhost = Host.objects.get_current()
        for obj in super(HostDependentQuerySet, self).iterator():
            curr = obj
            for field in self.model.objects.hostfilter.split('__'):
                if curr is None:
                    raise ValueError("got none when querying model '%s' instance '%s' for field "
                                     "'%s'" % (self.model, obj.id, field))
                curr = getattr(curr, field)
                if isinstance(curr, Host):
                    break
            if curr == currhost:
                yield obj
        raise StopIteration

    def count(self):
        return len(list(self.iterator()))


class HostDependentManager(models.Manager):
    hostfilter = "host"

    def get_queryset(self):
        return HostDependentQuerySet(self.model, using=self._db)


def getHostDependentManagerClass(hostfilter="host"):
    return type("FilteredHostDependentManager", (HostDependentManager,), {"hostfilter": hostfilter})


class HostGroup(models.Model):
    name = models.CharField(max_length=250)
    hosts = models.ManyToManyField(Host)

    def __unicode__(self):
        return "%s (%d hosts)" % (self.name, self.hosts.count())


class NetDevice(models.Model):
    host = models.ForeignKey(Host)
    devname = models.CharField(max_length=15)
    dhcp = models.BooleanField(default=False, blank=True)
    auto = models.BooleanField(default=True,  blank=True)
    jumbo = models.BooleanField(default=False, blank=True)
    slaves = models.ManyToManyField(
        'self', blank=True, symmetrical=False, related_name="bond_dev_set",
        help_text=_("If this interface is a bonding device, add the slave devices here."))
    brports = models.ManyToManyField(
        'self', blank=True, symmetrical=False, related_name="bridge_dev_set",
        help_text=_("If this interface is a bridge, add the ports here."))
    vlanrawdev = models.ForeignKey(
        'self', blank=True, null=True, related_name="vlan_dev_set",
        help_text=_("If this interface is VLAN device, name the raw device here."))

    bond_mode = models.CharField(max_length=50, default="active-backup", choices=BOND_MODE_CHOICES)
    bond_miimon = models.IntegerField(default=100)
    bond_downdelay = models.IntegerField(default=200)
    bond_updelay = models.IntegerField(default=200)

    objects = HostDependentManager()
    all_objects = models.Manager()

    class Meta:
        unique_together = ("host", "devname")

    def __unicode__(self):
        return self.devname

    @classmethod
    def get_root_devices(cls):
        """ Return all devices that are either a bonding, or a native which is not a bonding slave.
        """
        rootdevs = list(NetDevice.objects.filter(slaves__isnull=False).distinct())
        rootdevs.extend([dev for dev in NetDevice.objects.all()
                         if dev.devtype == "native" and
                         NetDevice.objects.filter(slaves__devname=dev.devname).count() == 0
                         ])
        return rootdevs

    @classmethod
    def validate_config(cls):
        """ Validate the current configuration. """
        haveaddr = False
        havegw = False
        havedns = False
        havedomain = False

        for interface in NetDevice.objects.all():
            if interface.childdevs and interface.ipaddress_set.filter(configure=True).count() > 0:
                raise ValueError(_("Interface %s has children and has an address") %
                                 interface.devname)

            if interface.dhcp:
                if interface.ipaddress_set.filter(configure=True).count() > 0:
                    raise ValueError(_("Interface %s uses DHCP but has an address") %
                                     interface.devname)
                if interface.childdevs:
                    raise ValueError(_("Interface %s has children and uses DHCP") %
                                     interface.devname)
                haveaddr = True
                havegw = True
                havedns = True
                havedomain = True

            elif interface.ipaddress_set.filter(configure=True).count() > 0:
                for address in interface.ipaddress_set.filter(configure=True):
                    if not address.is_loopback:
                        addr = address.address.split("/")
                        haveaddr = True
                        if len(addr) == 1:
                            raise ValueError(_("Interface %s has an address without a netmask") %
                                             interface.devname)
                        if address.gateway:
                            havegw = True
                        if address.domain:
                            havedomain = True
                        if address.nameservers:
                            havedns = True

            if interface.vlanrawdev:
                base = interface.vlanrawdev
                if base == interface:
                    raise ValueError(_("Vlan %s has ITSELF as its base interface") %
                                     interface.devname)

            if interface.brports.all().count():
                if interface.brports.filter(id=interface.id).count():
                    raise ValueError(_("Bridge %s has ITSELF as one of its ports") %
                                     interface.devname)

            if interface.slaves.count():
                if interface.slaves.filter(id=interface.id).count():
                    raise ValueError(_("Bonding %s has ITSELF as one of its slaves") %
                                     interface.devname)
                if interface.slaves.filter(jumbo=(not interface.jumbo)).count():
                    raise ValueError(_("Bonding %s has slaves with mismatching Jumbo Frames "
                                       "setting") % interface.devname)

        if not haveaddr:
            raise ValueError(_("There is no interface that has an IP (none with dhcp and none with "
                               "static address)."))

        if not havegw:
            raise ValueError(_("There is no default gateway."))

        if not havedns:
            raise ValueError(_("There is are no name servers configured."))

        if not havedomain:
            raise ValueError(_("There is no domain configured."))

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
        return statfile(self.devname, "operstate") == 'up'

    @property
    def carrier(self):
        if not self.operstate:
            return None
        return statfile(self.devname, "carrier") == '1'

    @property
    def macaddress(self):
        return statfile(self.devname, "address")

    @property
    def mtu(self):
        mtu = statfile(self.devname, "mtu")
        if mtu is None:
            return None
        return int(mtu)

    @property
    def speed(self):
        if self.devname == "lo":
            return None
        elif self.devtype == "native":
            if not self.operstate:
                return None
            speed = statfile(self.devname, "speed")
            if speed is None:
                return None
            return int(speed)
        else:
            if self.vlanrawdev:
                return self.vlanrawdev.speed

            if self.brports.all().count():
                return min([port.speed for port in self.brports.all()])

            if self.slaves.count():
                return min([slave.speed for slave in self.slaves.all()])
        raise ValueError("Speed could not be determined")

    def get_addresses(self, af=None):
        addrs = []
        ifaddrs = netifaces.ifaddresses(self.devname)
        if af is None:
            af = (socket.AF_INET, socket.AF_INET6)
        for ifaddrfam in ifaddrs:
            for addrinfo in ifaddrs[ifaddrfam]:
                if ifaddrfam not in af or addrinfo["addr"] in addrs:
                    continue
                curaddr = netaddr.IPNetwork("%s/%s" % (addrinfo["addr"].split('%')[0],
                                                       addrinfo["netmask"]))
                curaddr.iface = self.devname
                curaddr.family = ifaddrfam

                addrs.append(curaddr)
        return addrs

    @classmethod
    def write_interfaces(cls):
        from systemd import get_dbus_object
        get_dbus_object("/ifconfig").write_interfaces()


class IPAddress(models.Model):
    address = models.CharField(max_length=250)
    gateway = models.CharField(max_length=50, blank=True)
    nameservers = models.CharField(max_length=50, blank=True, null=True)
    domain = models.CharField(max_length=250, blank=True, null=True)
    device = models.ForeignKey(NetDevice, blank=True, null=True)
    configure = models.BooleanField(blank=True, default=True)
    primary_address = models.BooleanField(blank=True, default=False)

    objects = getHostDependentManagerClass("device__host")()
    all_objects = models.Manager()

    @property
    def in_use(self):
        for relobj in (self._meta.get_all_related_objects() +
                       self._meta.get_all_related_many_to_many_objects()):
            if relobj.model.objects.filter(**{relobj.field.name: self}).count() > 0:
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

    def __unicode__(self):
        return self.address


if "nagios" in settings.INSTALLED_APPS:
    def __create_service_for_ipaddress(instance, **kwargs):
        # can't import these in the module scope, because nagios imports stuff from us.
        from nagios.models import Command, Service
        from nagios.conf import settings as nagios_settings
        from django.contrib.contenttypes.models import ContentType
        cmd = Command.objects.get(name=nagios_settings.TRAFFIC_CHECK_CMD)
        ctype = ContentType.objects.get_for_model(instance.__class__)
        if Service.objects.filter(command=cmd, target_type=ctype, target_id=instance.id).count != 0:
            return
        srv = Service(host=Host.objects.get_current(), target=instance, command=cmd,
                      description=nagios_settings.TRAFFIC_DESCRIPTION % instance.device.devname,
                      arguments=instance.device.devname)
        srv.save()

    def __delete_service_for_ipaddress(instance, **kwargs):
        # can't import these in the module scope, because nagios imports stuff from us.
        from nagios.models import Service
        from django.contrib.contenttypes.models import ContentType
        ctype = ContentType.objects.get_for_model(instance.__class__)
        for srv in Service.objects.filter(target_type=ctype, target_id=instance.id):
            srv.delete()

    signals.post_save.connect(__create_service_for_ipaddress, sender=IPAddress)
    signals.post_delete.connect(__delete_service_for_ipaddress, sender=IPAddress)
