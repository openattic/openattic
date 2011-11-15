# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import os
import socket
import netifaces

import ifconfig.models
from ifconfig.models  import NetDevice, IPAddress
from django.db.models import signals

def create_interfaces(app, created_models, verbosity, **kwargs):
    if os.path.exists("/proc/net/vlan/config"):
        with open("/proc/net/vlan/config") as vlanconf:
            vlans = [ [ field.strip() for field in line.split('|') ] for line in vlanconf ]
            vlans = dict( [ ( vln[0], vln[1:] ) for vln in vlans[2:] ] )
    else:
        vlans = {}

    ifstack = netifaces.interfaces()
    haveifaces = {}

    while ifstack:
        iface = ifstack.pop(0)
        if iface == "lo":
            continue
        elif iface[:3] == "tap":
            continue

        args = {"devname": iface}

        if iface in vlans:
            depends = [vlans[iface][1]]
            iftype  = "VLAN"

        elif os.path.exists( "/sys/class/net/%s/brif" % iface ):
            depends = [depiface for depiface in os.listdir("/sys/class/net/%s/brif" % iface) if "tap" not in depiface]
            iftype  = "BRIDGE"

        elif os.path.exists( "/sys/class/net/%s/bonding/slaves" % iface ):
            depends = open("/sys/class/net/%s/bonding/slaves" % iface).read().strip().split()
            iftype  = "BONDING"
            args["bond_mode"]      =     open("/sys/class/net/%s/bonding/mode"      % iface).read().strip().split()[0]
            args["bond_miimon"]    = int(open("/sys/class/net/%s/bonding/miimon"    % iface).read().strip())
            args["bond_downdelay"] = int(open("/sys/class/net/%s/bonding/updelay"   % iface).read().strip())
            args["bond_updelay"]   = int(open("/sys/class/net/%s/bonding/downdelay" % iface).read().strip())

        else:
            depends = []
            iftype  = "NATIVE"

        havealldeps = True
        for depiface in depends:
            if depiface not in haveifaces:
                havealldeps = False
                break

        if not havealldeps:
            ifstack.append(iface)
            print "Missing dependency for %s" % iface, haveifaces, depends
            continue

        try:
            haveifaces[iface] = NetDevice.objects.get(devname=iface)
            print "Found", iface

        except NetDevice.DoesNotExist:
            print "Adding", iface
            haveifaces[iface] = NetDevice(**args)
            haveifaces[iface].save()

            if iftype in ("BRIDGE", "BONDING"):
                depifaces = [ haveifaces[depiface] for depiface in depends ]
                if iftype == "BRIDGE":
                    haveifaces[iface].brports = depifaces
                else:
                    haveifaces[iface].slaves  = depifaces

            elif iftype == "VLAN":
                haveifaces[iface].vlanrawdev  = depends[0]

        #print "%s is a %s device with depends to %s" % ( iface, iftype, ','.join(depends) )
        #print args

        ips = netifaces.ifaddresses(iface)
        if socket.AF_INET in ips:
            print "IPv4 addresses:", [ addr["addr"] + "/" + addr["netmask"] for addr in ips[socket.AF_INET] ]
        if socket.AF_INET6 in ips:
            print "IPv6 addresses:", [ addr["addr"] + "/" + addr["netmask"] for addr in ips[socket.AF_INET6] ]


signals.post_syncdb.connect(create_interfaces, sender=ifconfig.models)
