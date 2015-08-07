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

    def _get_volume_data(self):
        """ Return volume creation data. """
        return {
            "name": "gatling_volume",
            "megs": self.smallsize,
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


class ZfsNativePoolVolumeTestCase(ZfsNativePoolTestScenario, ZfsVolumeTests):
    """ Runs our ZFS subvolume tests against the native ZPool. """
    pass


class ZfsLvmPoolVolumeTestCase(ZfsLvmPoolTestScenario, ZfsVolumeTests):
    """ Runs our ZFS subvolume tests against the LVM zpool. """
    pass

