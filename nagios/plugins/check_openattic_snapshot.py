#!/usr/bin/env python
# -*- coding: utf-8 -*-
import dbus
import sys
from time import time
from optparse import OptionParser
from ConfigParser import ConfigParser

exit = 0
parser = OptionParser()


parser.add_option( "-d", "--dbus",
    help="DBus service to connect to.",
    default="org.openattic.systemd"
    )

parser.add_option( "-s", "--service",
    help="The service to query.",
    )

parser.add_option( "-i", "--interface",
    help="The interface to query.", default=''
    )
options, progargs = parser.parse_args()

if len(progargs) != 1:
  print("Usage: check_openattic_snapshot <lv name>")
  sys.exit(2)

stats = dbus.SystemBus().get_object(options.dbus, "/lvm").lvs()



def dbus_type_to_python(obj):
    """ Convert a single dbus something to its python equivalent. """
    conv = {
        dbus.Array: list,
        dbus.Dictionary: dict,
        dbus.Boolean: bool,
        dbus.Int16: int,
        dbus.Int32: int,
        dbus.Int64: int,
        dbus.String: unicode,
        dbus.Struct: tuple,
        tuple: tuple
        }
    return conv[type(obj)](obj)

def dbus_to_python(obj):
    """ Recursively convert a dbus something to its python equivalent,
        recursing over lists and dicts.
    """
    py = dbus_type_to_python(obj)
    if isinstance(py, list):
        return [dbus_to_python(el) for el in py]
    elif isinstance(py, tuple):
        return tuple([dbus_to_python(el) for el in py])
    elif isinstance(py, dict):
        return dict([(dbus_type_to_python(key), dbus_to_python(obj[key])) for key in py])
    return py

lvname = progargs[0]


if stats[lvname]["LVM2_ORIGIN"] == "":
  print("Sie haben ein Originalvolume ausgewählt!")
  sys.exit(2)

lv_percent = float(stats[lvname]["LVM2_SNAP_PERCENT"])  
print("snapshot %s is at %.2f%%"%(lvname,lv_percent))
#wenn snap_percent größer als 50% dann 'warning' zurückgegeben


lv_origin = stats[lvname]["LVM2_ORIGIN"]

# wenn original_lvsize kleiner als snapshot dann exitcode 2 
if float(stats[lvname]["LVM2_LV_SIZE"]) < float(stats[lv_origin]["LVM2_LV_SIZE"]):
  if lv_percent > 50.00:
    exit = 1

## wenn snap_percent größer als 70%, dann soll 'critical' zurückgegeben werden
  if lv_percent > 70.00:
    exit = 2

sys.exit(exit)