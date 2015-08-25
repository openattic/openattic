# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import unittest
import requests
import time

class VolumeTests(object):
    """ A collection of standardized tests to be run against some kind of
        BlockVolume that may or may not contain a file system.

        Class variables:

        * fstype: The type of filesystem with which volumes are to be created.
        * smallsize: Small volume size (used for standard and shrink tests).
        * bigsize: Big volume size (used for grow and shrink tests).
        * api_prefix: Prefix for the related REST API part (http://oaHost/openattic/api/<api_prefix>)
    """
    fstype      = None
    tinysize    = 500
    smallsize   = 1000
    bigsize     = 2000
    api_prefix  = "volumes"
    sleeptime   = 8

    def _get_pool(self):
        """ This method returns the pool in which we are to create volumes and
            is best provided by the test scenario classes.
        """
        raise NotImplemented("VolumeTests._get_pool needs to be overridden")

    def _get_volume_data(self, size, name=None):
        """ Return volume creation data with small volume size. """
        if not name:
            name = "gatling_volume"

        data = {"megs": size,
                "name": name,
                "source_pool": {"id": self._get_pool()["id"]}}
        if self.fstype:
            data["filesystem"] = self.fstype
        return data

    def _get_snapshot_data(self, size, volume_id):
        return {
            "megs": size,
            "name": "volume_snapshot_made_by_gatling",
            "volumeId": volume_id}

    def test_create_get_delete(self):
        """ Create a volume and check its properties. """
        # create a volume
        data = self._get_volume_data(self.smallsize)
        vol = self.send_request("POST", data=data)
        self.send_request("GET")
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])
        self.check_volume_properties(vol)

        # get the volume and check properties
        vol_get = self.send_request("GET", obj_id=vol["response"]["id"])
        self.check_volume_properties(vol_get)

    def test_create_delete_three_times(self):
        """ See if we can re-use volume names. """
        # self.addCleanup does not work here because the cleanup code has to run
        # in between loop iterations instead of after the test.
        data = self._get_volume_data(self.smallsize)

        for i in range(3):
            try:
                vol = self.send_request("POST", data=data)
                time.sleep(self.sleeptime)
                self.check_volume_properties(vol)
            finally:
                self.send_request("DELETE", obj_id=vol["response"]["id"])

    def test_create_and_brutally_delete(self):
        """ See if we can delete volumes while they are being created. """
        data = self._get_volume_data(self.smallsize)
        vol = self.send_request("POST", data=data)
        self.send_request("DELETE", obj_id=vol["response"]["id"])

    def test_create_filesystem_after_blockvolume(self):
        """ Create a volume and format it afterwards. """
        if self.fstype is None:
            raise unittest.SkipTest("need a filesystem for this test")

        data = self._get_volume_data(self.smallsize)
        fs = data.pop("filesystem")
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])
        self.assertFalse(vol["response"]["is_filesystemvolume"])
        self.assertIn(vol["response"]["status"]["status"], ["good", "locked"])

        self.send_request("PUT", obj_id=vol["response"]["id"], data={"id": vol["response"]["id"],
                                                                     "filesystem": fs})
        time.sleep(self.sleeptime)
        updated_vol = self.send_request("GET", obj_id=vol["response"]["id"])
        self.check_volume_properties(updated_vol)

    def test_grow(self):
        """ Grow a volume. """
        # create a volume
        data = self._get_volume_data(self.smallsize)
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])
        self.assertLessEqual(vol["response"]["usage"]["size"], self.smallsize)
        self.assertIn(vol["response"]["status"]["status"], ["good", "locked"])

        # resize the volume and check properties
        self.send_request("PUT", obj_id=vol["response"]["id"], data={"megs": self.bigsize,
                                                                     "id": vol["response"]["id"]})
        # bad workaround if systemd is not able to unmount the volume in time
        time.sleep(self.sleeptime)
        resized_vol = self.send_request("GET", obj_id=vol["response"]["id"])
        self.check_volume_properties(resized_vol, self.bigsize)
        self.assertGreater(resized_vol["response"]["usage"]["size"], self.smallsize)
        self.assertIn(resized_vol["response"]["status"]["status"], ["good", "locked"])

    def test_shrink(self):
        """ Shrink a volume. """
        # create a volume
        data = self._get_volume_data(self.bigsize)
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])
        self.assertLessEqual(vol["response"]["usage"]["size"], self.bigsize)
        self.assertIn(vol["response"]["status"]["status"], ["good", "locked"])

        # resize the volume and check properties
        self.send_request("PUT", obj_id=vol["response"]["id"], data={"megs": self.smallsize,
                                                                     "id": vol["response"]["id"]})
        # bad workaround if systemd is not able to unmount the volume in time
        time.sleep(self.sleeptime)
        resized_vol = self.send_request("GET", obj_id=vol["response"]["id"])
        self.check_volume_properties(resized_vol)
        self.assertIn(resized_vol["response"]["status"]["status"], ["good", "locked"])

    # test_grow_huge

    def test_snapshot(self):
        """ Create a snapshot and check its properties. """
        # create a volume
        data = self._get_volume_data(self.smallsize)
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])

        # create a snapshot and check properties
        snap_data = self._get_snapshot_data(self.smallsize, vol["response"]["id"])
        snap = self.send_request("POST", ["volumes", "snapshots"], obj_id=vol["response"]["id"], data=snap_data)
        self.send_request("GET")
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", snap["cleanup_url"], headers=snap["headers"])
        self.check_snapshot_properties(snap, vol["response"]["id"])

    def test_snapshot_brutal_delete(self):
        """ Create a snapshot and delete the origin. """
        # create a volume
        data = self._get_volume_data(self.smallsize)
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])

        # create and delete a snapshot
        snap_data = self._get_snapshot_data(self.smallsize, vol["response"]["id"])
        snap = self.send_request("POST", ["volumes", "snapshots"], obj_id=vol["response"]["id"], data=snap_data)
        time.sleep(self.sleeptime)
        self.send_request("DELETE", "snapshots", obj_id=snap["response"]["id"])
        self.send_request("GET")

    def test_clone_to_new_vol(self):
        """ Clone this volume to a volume created in the process. """
        # create a volume
        data = self._get_volume_data(self.smallsize)
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])

        # create a clone
        clone = self.send_request("POST", ["volumes", "clone", "volumes"], obj_id=vol["response"]["id"],
                                  data={"id": vol["response"]["id"], "name": "gatling_clone"})
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", clone["cleanup_url"], headers=clone["headers"])
        self.check_clone_properties(clone)

    def test_clone_not_enough_space_in_pool(self):
        """ Clone this volume to a volume created in the process when the volume pool does not have room. """
        # wait while pool status is still locked
        while self._get_pool()["status"]["status"] == 'locked':
            time.sleep(self.sleeptime)

        # create a volume
        hugesize = self._get_pool()["usage"]["free"] - self.tinysize
        data = self._get_volume_data(hugesize)
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])

        # try to create a clone
        with self.assertRaises(requests.HTTPError) as err:
            clone = self.send_request("POST", ["volumes", "clone", "volumes"], obj_id=vol["response"]["id"],
                                      data={"id": vol["response"]["id"], "name": "gatling_clone"})
            time.sleep(self.sleeptime)
            self.addCleanup(requests.request, "DELETE", clone["cleanup_url"], headers=clone["headers"])

    def test_clone_snapshot_to_new_vol(self):
        """ Clone a snapshot to a volume created in the process. """
        # create volume
        data = self._get_volume_data(self.smallsize)
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])

        # create snapshot
        snap_data = self._get_snapshot_data(self.smallsize, vol["response"]["id"])
        snap = self.send_request("POST", ["volumes", "snapshots"], obj_id=vol["response"]["id"], data=snap_data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", snap["cleanup_url"], headers=snap["headers"])

        # create snapshot clone
        clone = self.send_request("POST", ["snapshots", "clone", "volumes"], obj_id=snap["response"]["id"],
                                  data={"id": snap["response"]["id"], "name": "gatling_clone"})
        self.addCleanup(requests.request, "DELETE", clone["cleanup_url"], headers=clone["headers"])
        self.check_clone_properties(clone)

    # cloning into a existing volume is currently not supported by openattics rest api

    # mount/unmount actions are currently not supported by openattics rest api

    def test_create_not_enough_space(self):
        """ Try creating a volume bigger than the pool and check that this fails. """
        data = self._get_volume_data(self._get_pool()["usage"]["size"] * 2)

        with self.assertRaises(requests.HTTPError) as err:
            vol = self.send_request("POST", data=data)
            time.sleep(self.sleeptime)
            self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])
        self.assertEqual(str(err.exception), "500 Server Error: Internal Server Error")

    def test_create_0mb(self):
        """ Create a volume with 0 MB size. """
        data = self._get_volume_data(0)

        with self.assertRaises(requests.HTTPError) as err:
            vol = self.send_request("POST", data=data)
            time.sleep(self.sleeptime)
            self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])
        self.assertEqual(str(err.exception), "500 Server Error: Internal Server Error")

    def test_resize_0mb(self):
        """ Resize a volume to 0 MB. """
        data = self._get_volume_data(self.smallsize)
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])

        with self.assertRaises(requests.HTTPError) as err:
            self.send_request("PUT", obj_id=vol["response"]["id"], data={"megs": 0, "id": vol["response"]["id"]})
        self.assertEqual(str(err.exception), "500 Server Error: Internal Server Error")


class Ext4VolumeTests(VolumeTests):
    fstype = "ext4"


class XfsVolumeTests(VolumeTests):
    fstype = "xfs"

    def test_shrink(self):
        """ Try shrinking an XFS to see if it fails (as it should). """
        data = self._get_volume_data(self.bigsize)
        vol = self.send_request("POST", data=data)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])

        self.assertLessEqual(vol["response"]["usage"]["size"], self.bigsize)

        with self.assertRaises(requests.HTTPError) as err:
            self.send_request("PUT", obj_id=vol["response"]["id"], data={"megs": 0, "id": vol["response"]["id"]})
        self.assertEqual(str(err.exception), "500 Server Error: Internal Server Error")
