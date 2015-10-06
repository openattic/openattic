
import requests, time

from drbd.scenarios import DrbdTestScenario

class DrbdTests(object):
    sleeptime = 8

    def test_create_get_delete(self):
        """ Create a Connection and check that its Endpoints are created correctly. """
        # Create a volume that should be mirrored
        vol = self._get_mirror_volume(self._get_pool()["id"])

        # Create the drbd mirror
        mirror_data = {"source_volume"  : vol,
                       "remote_pool"    : self._get_remote_pool(),
                       "protocol"       : "C",
                       "syncer_rate"    : "30M"}
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
        vol = self._get_mirror_volume(self._get_remote_pool()["id"])

        # Create a drbd mirror
        mirror_data = {"source_volume"  : vol,
                       "remote_pool"    : self._get_pool(),
                       "protocol"       : "C",
                       "syncer_rate"    : "30M"}
        mirror_res = self.send_request("POST", "mirrors", data=mirror_data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", mirror_res["cleanup_url"], headers=mirror_res["headers"])

        # Check if there are to endpoints (volumes) related to this drbd mirror
        upper_id = "upper__id=%s" % mirror_res["response"]["volume"]["id"]
        endpoints_res = self.send_request("GET", "volumes", search_param=upper_id)
        self.assertEqual(endpoints_res["count"], 2, msg="number of endpoints is not equal 2")

    def test_create_protocol_f(self):
        """ Try to create a Connection with protocol F. """
        # Create a volume that should be mirrored
        vol = self._get_mirror_volume(self._get_pool()["id"])

        # Try to create the drbd mirror with protocol F
        mirror_data = {"source_volume"  : vol,
                       "remote_pool"    : self._get_remote_pool(),
                       "protocol"       : "F",
                       "syncer_rate"    : "30M"}
        with self.assertRaises(requests.HTTPError) as err:
            mirror_res = self.send_request("POST", "mirrors", data=mirror_data)
            time.sleep(self.sleeptime)
            self.send_request("DELETE", "mirrors", obj_id=mirror_res["response"]["id"])
        self.send_request("DELETE", "volumes", obj_id=vol["id"])
        self.assertEqual(str(err.exception), "400 Client Error: Bad Request")

    def test_create_0m(self):
        """ Try to create a Connection with syncer rate set to 0M. """
        # Create a volume that should be mirrored
        vol = self._get_mirror_volume(self._get_pool()["id"])

        # Try to create the drbd mirror with syncer rate 0M
        mirror_data = {"source_volume"  : vol,
                       "remote_pool"    : self._get_remote_pool(),
                       "protocol"       : "C",
                       "syncer_rate"    : "0M"}
        with self.assertRaises(requests.HTTPError) as err:
            mirror_res = self.send_request("POST", "mirrors", data=mirror_data)
            time.sleep(self.sleeptime)
            self.send_request("DELETE", "mirrors", obj_id=mirror_res["response"]["id"])
        self.send_request("DELETE", "volumes", obj_id=vol["id"])
        self.assertEqual(str(err.exception), "400 Client Error: Bad Request")

    def _get_mirror_volume(self, source_pool_id):
        vol_data = {"megs": 1000,
                    "name": "gatling_drbd_vol1",
                    "source_pool": {"id": source_pool_id}}
        vol_res = self.send_request("POST", "volumes", data=vol_data)
        time.sleep(self.sleeptime)
        return vol_res["response"]


class DrbdTestCase(DrbdTestScenario, DrbdTests):
    pass
