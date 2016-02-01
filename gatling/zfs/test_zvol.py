# -*- coding: utf-8 -*-

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

import time, requests

from zfs.scenarios import ZfsNativePoolTestScenario, ZfsLvmPoolTestScenario
from lio.scenarios import LunTestScenario

from volumes.volumetests import VolumeTests


class ZfsZvolTests(VolumeTests):
    """ Contains tests concerning ZVols (block devices). """
    pass


class ZfsNativePoolZvolTestCase(ZfsNativePoolTestScenario, ZfsZvolTests):
    """ Runs our ZVol tests against the native ZPool. """
    pass


class ZfsLvmPoolZvolTestCase(ZfsLvmPoolTestScenario, ZfsZvolTests):
    """ Runs our ZVol tests against the LVM ZPool. """
    pass


class ZfsZvolLioTests(object):
    api_prefix = "volumes"

    def test_hostacl_create_get_delete(self):
        """ Create a HostACL for a ZVol. """
        # create a zvol
        data = {"megs"          : 1000,
                "name"          : "gatling_volume",
                "source_pool"   : {"id": self._get_pool()["id"]}}
        vol = self.send_request("POST", data=data)
        time.sleep(8)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])

        # create hostacl for zvol
        lun_data = {"volume": {"id": vol["response"]["id"]},
                    "host"  : self.initiator_host,
                    "lun_id": 1}
        host_acl = self.send_request("POST", "luns", data=lun_data)
        self.addCleanup(requests.request, "DELETE", host_acl["cleanup_url"], headers=host_acl["headers"])


class ZfsNativePoolZvolLioTestCase(ZfsNativePoolTestScenario, LunTestScenario, ZfsZvolLioTests):
    pass


class ZfsLvmPoolZvolLioTestCase(ZfsLvmPoolTestScenario, LunTestScenario, ZfsZvolLioTests):
    pass
