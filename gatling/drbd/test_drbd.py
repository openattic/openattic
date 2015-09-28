
import requests, time

from drbd.scenarios import DrbdTestScenario

class DrbdTests(object):
    sleeptime = 8

    def test_create_get_delete(self):
        """ Create a Connection and check that its Endpoints are created correctly. """
        # Create a volume that should be mirrored
        vol_data = {"megs"          : 1000,
                    "name"          : "gatling_drbd_vol1",
                    "source_pool"   : {"id": self._get_pool()["id"]}}
        vol_res = self.send_request("POST", "volumes", data=vol_data)
        time.sleep(self.sleeptime)

        # Create the drbd mirror
        mirror_data = {"source_volume"  : vol_res["response"],
                       "remote_pool"    : self._get_remote_pool()}
        mirror_res = self.send_request("POST", "mirrors", data=mirror_data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", mirror_res["cleanup_url"], headers=mirror_res["headers"])

        # Check if there are to endpoints (volumes) related to this drbd mirror
        upper_id = "upper__id=%s" % mirror_res["response"]["volume"]["id"]
        endpoints_res = self.send_request("GET", "volumes", search_param=upper_id)
        self.assertEqual(endpoints_res["count"], 2, msg="number of endpoints is not equal 2")

    def test_remote_create_get_delete(self):
        """ Create a Connection for a volume located on the remote host. """
        # Create a volume on the remote host
        vol_data = {"megs"          : 1000,
                    "name"          : "gatling_drbd_vol1",
                    "source_pool"   : {"id": self._get_remote_pool()["id"]}}
        vol_res = self.send_request("POST", "volumes", data=vol_data)
        time.sleep(self.sleeptime)

        # Create a drbd mirror
        mirror_data = {"source_volume"  : vol_res["response"],
                       "remote_pool"    : self._get_pool()}
        mirror_res = self.send_request("POST", "mirrors", data=mirror_data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", mirror_res["cleanup_url"], headers=mirror_res["headers"])

        # Check if there are to endpoints (volumes) related to this drbd mirror
        upper_id = "upper__id=%s" % mirror_res["response"]["volume"]["id"]
        endpoints_res = self.send_request("GET", "volumes", search_param=upper_id)
        self.assertEqual(endpoints_res["count"], 2, msg="number of endpoints is not equal 2")

class DrbdTestCase(DrbdTestScenario, DrbdTests):
    pass
