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

import unittest, requests, json

from testcase import GatlingTestCase

class LunTestScenario(GatlingTestCase):
    @classmethod
    def setUpClass(cls):
        super(LunTestScenario, cls).setUpClass()

        cls.require_enabled("lio")
        cls.require_config("lio:initiator",   "host", "iqn", "type")
        cls.require_config("lio:initiator:2", "host", "iqn", "type")
        cls.require_config("options", "host_name")

        host_name = cls.conf.get("options", "host_name")
        res_host = cls.send_request("GET", "hosts", search_param=("name=%s" % host_name))

        if res_host["count"] != 1:
            raise unittest.SkipTest("Current host %s not found" % host_name)

        cls.oa_host = res_host["response"][0]
        cls.ip = cls.oa_host["primary_ip_address"]

        initiator_host_name = cls.conf.get("lio:initiator", "host")
        cls.initiator_host = cls._get_or_create_object("hosts", ("name=%s" % initiator_host_name),
                                                       {"name": initiator_host_name}, "Initiator host")
        initiator_data = {"wwn": cls.conf.get("lio:initiator", "iqn"),
                          "type": cls.conf.get("lio:initiator", "type"),
                          "host": {"id": cls.initiator_host["id"]}}
        cls.initiator = cls._get_or_create_object("initiators", ("host=%s" % cls.initiator_host["id"]), initiator_data,
                                                  "Initiator")

        initiator_host_name2 = cls.conf.get("lio:initiator:2", "host")
        cls.initiator_host2 = cls._get_or_create_object("hosts", ("name=%s" % initiator_host_name2),
                                                        {"name": initiator_host_name2}, "Initiator host 2")
        initiator_data2 = {"wwn": cls.conf.get("lio:initiator:2", "iqn"),
                           "type": cls.conf.get("lio:initiator:2", "type"),
                           "host": {"id": cls.initiator_host2["id"]}}
        cls.initiator2 = cls._get_or_create_object("initiators", ("host=%s" % cls.initiator_host2["id"]),
                                                   initiator_data2, "Initiator 2")

    @classmethod
    def setUp(self):
        self.delete_old_existing_gatling_volumes()

    @classmethod
    def _get_or_create_object(cls, api_prefix, filter_params, create_params, err_str):
        obj = cls.send_request("GET", api_prefix, search_param=filter_params)

        if obj["count"] <= 0:
            obj = cls.send_request("POST", api_prefix, data=create_params)
            return obj["response"]
        elif obj["count"] == 1:
            return obj["response"][0]
        else:
            raise unittest.SkipTest("%s could not be found or created." % err_str)


