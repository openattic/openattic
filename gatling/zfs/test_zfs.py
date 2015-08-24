import requests, time

from nfs.scenarios import NfsTestScenario
from zfs.scenarios import ZfsNativePoolTestScenario, ZfsLvmPoolTestScenario

class ZfsVolumeTests(object):
    """ Contains tests concerning ZFS subvolumes (file systems). """

    # TODO: should inherit VolumeTests sometime, but currently most of the features
    # tested by VolumeTests are not supported for Zfs subvolumes, and those that are
    # require being tested differently because they don't use any blockdevices.

    api_prefix  = "volumes"
    sleeptime   = 8
    smallsize   = 1000
    fstype      = "zfs"

    def _get_volume_data(self, size=None):
        """ Return volume creation data. """
        if not size:
            size = self.smallsize

        return {
            "name": "gatling_volume",
            "megs": size,
            "source_pool": {"id": self._get_pool()["id"]},
            "filesystem": self.fstype
        }

    def _get_snapshot_data(self, volume_id):
        return {
            "megs": self.smallsize,
            "name": "volume_snapshot_made_by_gatling",
            "volumeId": volume_id
        }

    def test_create_get_delete(self):
        """ Create a ZFS subvolume and check its properties. """
        data = self._get_volume_data()
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])
        self.check_volume_properties(vol)

    def test_snapshot(self):
        """ Create a snapshot and check its properties. """
        # create a volume
        data = self._get_volume_data()
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])

        # create a snapshot
        snap_data = self._get_snapshot_data(vol["response"]["id"])
        snap = self.send_request("POST", ["volumes", "snapshots"], obj_id=vol["response"]["id"], data=snap_data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", snap["cleanup_url"], headers=snap["headers"])
        self.check_snapshot_properties(snap, vol["response"]["id"])

    def test_create_equal_space(self):
        """ Create a volume of *exactly* the same size as the zpool, meaning there's no quota involved. """
        data = self._get_volume_data(self._get_pool()["usage"]["size"])
        vol = self.send_request("POST", data=data)
        time.sleep(self.sleeptime)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])
        self.check_volume_properties(vol, self._get_pool()["usage"]["size"])

    def test_create_not_enough_space(self):
        """ Try creating a volume bigger than the pool and check that this fails. """
        data = self._get_volume_data(self._get_pool()["usage"]["size"] * 2)

        with self.assertRaises(requests.HTTPError) as err:
            vol = self.send_request("POST", data=data)

        self.assertTrue("500 Server Error: Internal Server Error" in err.exception)


class ZfsNativePoolVolumeTestCase(ZfsNativePoolTestScenario, ZfsVolumeTests):
    """ Runs our ZFS subvolume tests against the native ZPool. """
    pass


class ZfsLvmPoolVolumeTestCase(ZfsLvmPoolTestScenario, ZfsVolumeTests):
    """ Runs our ZFS subvolume tests against the LVM zpool. """
    pass


class NfsShareTest(object):
    api_prefix  = "volumes"

    def test_zfs_nfs_share(self):
        """ Create an Export for a ZFS subvolume. """
        # create a volume
        data = {"name"          : "gatling_volume",
                "megs"          : 1000,
                "source_pool"   : {"id": self._get_pool()["id"]},
                "filesystem"    : "zfs"}
        vol = self.send_request("POST", data=data)
        time.sleep(8)
        self.addCleanup(requests.request, "DELETE", vol["cleanup_url"], headers=vol["headers"])

        # create nfs export
        export_data = {"volume" : {"id": vol["response"]["id"]},
                       "path"   : "/media/%s/gatling_volume" % self._get_pool()["name"],
                       "address": self.conf.get("nfs:export", "address"),
                       "options": self.conf.get("nfs:export", "options")}
        share = self.send_request("POST", "nfsshares", data=export_data)
        self.addCleanup(requests.request, "DELETE", share["cleanup_url"], headers=share["headers"])


class ZfsNativePoolNfsTestCase(ZfsNativePoolTestScenario, NfsTestScenario, NfsShareTest):
    pass


class ZfsLvmPoolNfsTestCase(ZfsLvmPoolTestScenario, NfsTestScenario, NfsShareTest):
    pass
