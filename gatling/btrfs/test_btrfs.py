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

import time
import requests

from btrfs.scenarios import BtrfsLvmPoolTestScenario


class BtrfsVolumeTests(object):
    fstype = "btrfs"
    api_prefix = "volumes"
    sleeptime = 8

    """ Contains tests concerning BTRFS subvolumes (file systems). """

    # TODO: should inherit VolumeTests sometime, but currently most of the features
    # tested by VolumeTests are not supported for Btrfs subvolumes, and those that are
    # require being tested differently because they don't use any blockdevices.

    def test_create_get_delete(self):
        """ Create a subvolume and check its properties. """
        size = self._get_pool()["usage"]["size"]
        data = {"filesystem": "btrfs",
                "megs": size,
                "name": "gatling_volume",
                "source_pool": {"id": self._get_pool()["id"]}}
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])
        self.check_volume_properties(vol, size)

    def test_snapshot(self):
        """ Create a snapshot of a subvolume and check its properties. """
        size = self._get_pool()["usage"]["size"]
        data = {"filesystem": "btrfs",
                "megs": size,
                "name": "gatling_volume",
                "source_pool": {"id": self._get_pool()["id"]}}
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])

        snap_data = {"megs": size,
                     "name": "volume_snapshot_made_by_gatling",
                     "volumeId": vol["response"]["id"]}
        snap = self.send_request("POST", ["volumes", "snapshots"], obj_id=vol["response"]["id"],
                                 data=snap_data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", snap["cleanup_url"], headers=snap["headers"])
        self.check_snapshot_properties(snap, vol["response"]["id"], size)

    def test_volume_grow(self):
        """ Grow BTRFS volume """
        # create new volume in btrfs pool
        size = self._get_pool()["usage"]["size"]
        data = {"filesystem": "btrfs",
                "megs": size,
                "name": "gatling_volume",
                "source_pool": {"id": self._get_pool()["id"]}}
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])

        # try to grow the btrfs subvolume and check for error
        with self.assertRaises(requests.HTTPError) as err:
            self.send_request("PUT", obj_id=vol["response"]["id"],
                              data={"megs": size + 1000, "id": vol["response"]["id"]})
        self.check_exception_messages(err, self.error_messages["test_volume_grow"])

    def test_volume_shrink(self):
        """ Shrink BTRFS volume"""
        size = self._get_pool()["usage"]["size"]
        data = {"filesystem": "btrfs",
                "megs": size,
                "name": "gatling_volume",
                "source_pool": {"id": self._get_pool()["id"]}}
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])

        # try to grow the btrfs subvolume and check for error
        with self.assertRaises(requests.HTTPError) as err:
            self.send_request("PUT", obj_id=vol["response"]["id"],
                              data={"megs": size - 1000, "id": vol["response"]["id"]})
        self.check_exception_messages(err, self.error_messages["test_volume_shrink"])


class BtrfsPoolTests(object):
    fstype = "btrfs"
    api_prefix = "volumes"
    sleeptime = 8

    """ Contains tests concerning BTRFS pools. """

    def test_pool_grow(self):
        """ Grow BTRFS pool """
        # get pool information
        pool = self._get_pool()
        old_size = pool["usage"]["size"]
        new_size = old_size + 1000

        # resize the pool
        self.send_request("PUT", obj_id=pool["id"], data={"megs": new_size, "id": pool["id"]})
        time.sleep(self.sleeptime)

        # get pool and check properties
        resized_pool = self.send_request("GET", obj_id=pool["id"])
        self.assertGreaterEqual(resized_pool["response"]["usage"]["size"], old_size)
        self.assertLessEqual(resized_pool["response"]["usage"]["size"], new_size)
        self.assertIn(resized_pool["response"]["status"]["status"], ["good", "locked"])

    def test_pool_shrink(self):
        """ Shrink BTRFS pool """
        # get pool information
        pool = self._get_pool()
        old_size = pool["usage"]["size"]
        new_size = old_size - 1000

        # resize the pool
        with self.assertRaises(requests.HTTPError) as err:
            self.send_request("PUT", obj_id=pool["id"], data={"megs": new_size, "id": pool["id"]})
        self.check_exception_messages(err, self.error_messages["test_pool_shrink"])


class BtrfsLvmPoolTestCase(BtrfsLvmPoolTestScenario, BtrfsVolumeTests, BtrfsPoolTests):
    pass
