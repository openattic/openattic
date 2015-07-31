
import requests, time

from lvm.scenarios import LvTestScenario, RemoteLvTestScenario
from lio.scenarios import LunTestScenario
from nfs.scenarios import NfsTestScenario
from samba.scenarios import SambaTestScenario
from http.scenarios import HttpTestScenario
from volumes.volumetests import VolumeTests, Ext4VolumeTests, XfsVolumeTests


class LogicalVolumeTestCase(LvTestScenario, VolumeTests):
    pass

class LogicalVolumeExt4TestCase(LvTestScenario, Ext4VolumeTests):
    pass

class LogicalVolumeXfsTestCase(LvTestScenario, XfsVolumeTests):
    pass


class RemoteLogicalVolumeTestCase(RemoteLvTestScenario, VolumeTests):
    pass

class RemoteLogicalVolumeExt4TestCase(RemoteLvTestScenario, Ext4VolumeTests):
    pass

class RemoteLogicalVolumeXfsTestCase(RemoteLvTestScenario, XfsVolumeTests):
    pass


class LvLioTests(object):
    sleeptime   = 8

    def test_lv_hostacl_create_get_delete(self):
        """ Create a HostACL for an LV. """
        data = {"megs"          : 1000,
                "name"          : "gatling_volume",
                "source_pool"   : {"id": self.vg["id"]}}
        res_vol = self.send_request("POST", "volumes", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", res_vol["cleanup_url"], headers=res_vol["headers"])

        lun_data = {"volume": {"id": res_vol["response"]["id"]},
                    "host"  : self.initiator_host,
                    "lun_id": 1}
        res_host_acl = self.send_request("POST", "luns", data=lun_data)
        self.addCleanup(requests.request, "DELETE", res_host_acl["cleanup_url"], headers=res_host_acl["headers"])

    def test_lv_hostacl_create_get_delete_multi_with_same_lun_id(self):
        """ Create two HostACLs for an LV with the same LUN ID. """
        data = {"megs"          : 1000,
                "name"          : "gatling_volume",
                "source_pool"   : {"id": self.vg["id"]}}
        res_vol = self.send_request("POST", "volumes", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", res_vol["cleanup_url"], headers=res_vol["headers"])

        lun_data = {"volume": {"id": res_vol["response"]["id"]},
                    "host"  : self.initiator_host,
                    "lun_id": 1}
        res_host_acl = self.send_request("POST", "luns", data=lun_data)
        self.addCleanup(requests.request, "DELETE", res_host_acl["cleanup_url"], headers=res_host_acl["headers"])

        lun_data2 =  {"volume": {"id": res_vol["response"]["id"]},
                      "host"  : self.initiator_host2,
                      "lun_id": 1}
        res_host_acl2 = self.send_request("POST", "luns", data=lun_data2)
        self.addCleanup(requests.request, "DELETE", res_host_acl2["cleanup_url"], headers=res_host_acl2["headers"])

    def test_lv_hostacl_create_get_delete_multi_with_different_lun_id(self):
        """ Create two HostACLs for an LV with different LUN IDs. """
        data = {"megs"          : 1000,
                "name"          : "gatling_volume",
                "source_pool"   : {"id": self.vg["id"]}}
        res_vol = self.send_request("POST", "volumes", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", res_vol["cleanup_url"], headers=res_vol["headers"])

        lun_data = {"volume": {"id": res_vol["response"]["id"]},
                    "host"  : self.initiator_host,
                    "lun_id": 1}
        res_host_acl = self.send_request("POST", "luns", data=lun_data)
        self.addCleanup(requests.request, "DELETE", res_host_acl["cleanup_url"], headers=res_host_acl["headers"])

        lun_data2 =  {"volume": {"id": res_vol["response"]["id"]},
                      "host"  : self.initiator_host2,
                      "lun_id": 2}
        res_host_acl2 = self.send_request("POST", "luns", data=lun_data2)
        self.addCleanup(requests.request, "DELETE", res_host_acl2["cleanup_url"], headers=res_host_acl2["headers"])

class LioTestCase(LvTestScenario, LunTestScenario, LvLioTests):
    pass

class NfsShareTest(object):

    def test_lv_nfs_share(self):
        """ Create an export for an LV. """
        data = {"filesystem"    : "ext4",
                "megs"          : 1000,
                "name"          : "gatling_volume",
                "source_pool"   : {"id": self.vg["id"]}}
        res_vol = self.send_request("POST", "volumes", data=data)
        self.addCleanup(requests.request, "DELETE", res_vol["cleanup_url"], headers=res_vol["headers"])

        data = {"volume"    : {"id": res_vol["response"]["id"]},
                "path"      : "/media/gatling_volume",
                "address"   : self.conf.get("nfs:export", "address"),
                "options"   : self.conf.get("nfs:export", "options")}
        res_share = self.send_request("POST", "nfsshares", data=data)
        self.addCleanup(requests.request, "DELETE", res_share["cleanup_url"], headers=res_share["headers"])


class NfsShareTestCase(LvTestScenario, NfsTestScenario, NfsShareTest):
    pass


class SambaShareTest(object):
    def test_lv_samba_share(self):
        """ Create a share for an LV. """
        data = {"filesystem"    : "ext4",
                "megs"          : 1000,
                "name"          : "gatling_volume",
                "source_pool"   : {"id": self.vg["id"]}}
        res_vol = self.send_request("POST", "volumes", data=data)
        self.addCleanup(requests.request, "DELETE", res_vol['cleanup_url'], headers=res_vol['headers'])

        data = {"volume": {"id": res_vol["response"]["id"]},
                "name"  : "gatling_volume",
                "path"  : "/media/gatling_volume"}
        res_share = self.send_request("POST", "sambashares", data=data)
        self.addCleanup(requests.request, "DELETE", res_share['cleanup_url'], headers=res_share['headers'])


class SambaShareTestCase(LvTestScenario, SambaTestScenario, SambaShareTest):
    pass


class HttpShareTest(object):
    def test_lv_http_share(self):
        """ Create a share for an LV. """
        data = {"filesystem"    : "ext4",
                "megs"          : 1000,
                "name"          : "gatling_volume",
                "source_pool"   : {"id": self.vg["id"]}}
        res_vol = self.send_request("POST", "volumes", data=data)
        self.addCleanup(requests.request, "DELETE", res_vol['cleanup_url'], headers=res_vol['headers'])

        data = {"volume": {"id": res_vol["response"]["id"]},
                "path"  : "/media/gatling_volume"}
        res_share = self.send_request("POST", "httpshares", data=data)
        self.addCleanup(requests.request, "DELETE", res_share['cleanup_url'], headers=res_share['headers'])


class HttpShareTestCase(LvTestScenario, HttpTestScenario, HttpShareTest):
    pass