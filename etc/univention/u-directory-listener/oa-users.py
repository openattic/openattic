# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
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

__package__='' # workaround for PEP 366

import xmlrpclib

import listener
import univention.debug

import os
import stat

from ConfigParser import ConfigParser

name = "oa-users"
description = "Update user accounts in the openATTIC database"
filter = ("(&(objectClass=person)"
    "(objectClass=organizationalPerson)"
    "(objectClass=inetOrgPerson))")
attributes = ["uid", "givenName", "sn", "mailPrimaryAddress"]

__conf__ = ConfigParser()
__conf__.read("/etc/openattic/cli.conf")
__serv__ = xmlrpclib.ServerProxy(__conf__.get("options", "connect"))

def handler(dn, new, old):
    if new and new.get("uid"):
        uid = new.get("uid")[0]
        try:
            oauser = __serv__.auth.User.get({"username": uid})
        except xmlrpclib.Fault, err:
            # the user probably doesn't exist.
            univention.debug.debug(
                univention.debug.LISTENER, univention.debug.ERROR,
                "%s: failed to get user '%s', will try to create them: %s" % (name, uid, err))
            __serv__.auth.User.create({
                "username":     uid,
                "first_name":   new.get("givenName", [""])[0],
                "last_name":    new.get("sn", [""])[0],
                "email":        new.get("mailPrimaryAddress", [""])[0],
                "password":     "!",
                "is_active":    True,
                "is_staff":     False,
                "is_superuser": False,
                })
        else:
            if    oauser["first_name"] != new.get("givenName", [""])[0] \
                or oauser["last_name"]  != new.get("sn", [""])[0] \
                or oauser["email"]      != new.get("mailPrimaryAddress", [""])[0]:
                __serv__.auth.User.set(oauser["id"], {
                        "first_name":   new.get("givenName", [""])[0],
                        "last_name":    new.get("sn", [""])[0],
                        "email":        new.get("mailPrimaryAddress", [""])[0],
                        })

    elif old:
        uid = old.get("uid")[0]
        try:
            oauser = __serv__.auth.User.get({"username": uid})
        except xmlrpclib.Fault:
            # the user probably doesn't exist.
            univention.debug.debug(
                univention.debug.LISTENER, univention.debug.ERROR,
                "%s: failed to get user '%s', not trying to delete them: %s" % (name, uid, err))
        else:
            __serv__.auth.User.remove(oauser["id"])
