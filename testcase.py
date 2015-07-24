# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import unittest
import requests
import json

from xmlrpclib import Fault

class GatlingTestCase(unittest.TestCase):

    @classmethod
    def require_config(cls, section, *options):
        """ Make sure the given config section defines the given set of options.
            Otherwise, skip the test case.
        """
        if not cls.conf.has_section(section):
            raise unittest.SkipTest("missing config section %s" % section)
        for option in options:
            if not cls.conf.has_option(section, option):
                raise unittest.SkipTest("missing config option %s in section %s" % (option, section))

    @classmethod
    def require_enabled(cls, section):
        """ Make sure the given config section defines an "enabled" option set to "yes".
            Otherwise, skip the test case.
        """
        cls.require_config(section, "enabled")
        if not cls.conf.getboolean(section, "enabled"):
            raise unittest.SkipTest("%s tests disabled in configuration" % section)

    @classmethod
    def setUpClass(cls):
        try:
            res = requests.request("GET", "%s/users?username=openattic" % cls.conf.get("options", "connect"),
                                   headers={"Authorization": "Token %s" % cls.conf.get("options", "auth_token")})
        except requests.HTTPError:
            raise unittest.SkipTest("openATTIC REST api login failed. Check api url and authentication token")
        else:
            json_res = json.loads(res.text)
            if json_res["count"] == 0:
                raise unittest.SkipTest("admin user not found")
            cls.userid = json_res["results"][0]["id"]

    @classmethod
    def send_request(cls, method, prefixes=None, *args, **kwargs):
        """ Sends a request to openATTICs REST API and returns the response
        """
        prefixes = cls._get_sturctured_prefixes(prefixes)
        header = cls.get_auth_header()
        base_url = cls.conf.get("options", "connect")
        url = "%s%s" % (base_url, prefixes["api_prefix"])

        if "obj_id" in kwargs:
            url = "%s/%s" % (url, str(kwargs["obj_id"]))

        # POST, PUT
        if "data" in kwargs:
            if prefixes["detail_route"]:
                url = "%s/%s" % (url, prefixes["detail_route"])

            header["content-type"] = "application/json"

            res = requests.request(method, url, data=json.dumps(kwargs["data"]), headers=header)
            res.raise_for_status()
            res = json.loads(res.text)

            return {"response"      : res,
                    "count"         : 1,
                    "cleanup_url"   : cls._get_cleanup_url(res["id"], prefixes),
                    "headers"       : header}
        # GET, DELETE
        else:
            if "search_param" in kwargs:
                url = "%s?%s" % (url, kwargs["search_param"])
            res = requests.request(method, url, headers=header)
            res.raise_for_status()

            # For method DELETE no json object could be decoded, so just return the response otherwise
            # otherwise return the result dict
            try:
                res = json.loads(res.text)
            except:
                return {"response": res}
            else:
                if "obj_id" in kwargs:
                    header["content-type"] = "application/json"
                    return {"response"      : res,
                            "count"         : 1,
                            "cleanup_url"   : url,
                            "headers"       : header}
                else:
                    return {"response"  : res["results"],
                            "count"     : res["count"]}

    @classmethod
    def get_auth_header(cls):
        cls.require_config("options", "auth_token")
        return {"Authorization": "Token %s" % cls.conf.get("options", "auth_token")}

    @classmethod
    def delete_old_existing_gatling_volumes(cls):
        for name in ["gatling_volume", "gatling_clone", "volume_snapshot_made_by_gatling"]:
            res = cls.send_request("GET", "volumes", search_param=("name=%s" % name))
            if res["count"] > 0:
                for vol in res["response"]:
                    cls.send_request("DELETE", "volumes", obj_id=vol["id"])


    def check_base_properties(self, vol, max_size):
        if not max_size:
            max_size = self.smallsize

        self.assertIn("response", vol)
        vol_res = vol["response"]

        self.assertIn("id", vol_res)
        self.assertIn("is_filesystemvolume", vol_res)
        self.assertIn("path", vol_res)
        self.assertIn("is_volumepool", vol_res)
        self.assertIn("is_blockvolume", vol_res)
        self.assertIn("usage", vol_res)
        self.assertIn("size", vol_res["usage"])
        self.assertIn("status", vol_res)
        self.assertIn("status", vol_res["status"])
        self.assertFalse(vol_res["is_volumepool"])
        self.assertLessEqual(vol_res["usage"]["size"], max_size)
        self.assertIn(vol_res["status"]["status"], ["good", "locked"])

        if self.fstype is None:
            self.assertFalse(vol_res["is_filesystemvolume"])
        else:
            self.assertIn("type", vol_res)
            self.assertIn("name", vol_res["type"])
            self.assertTrue(vol_res["is_filesystemvolume"])

            if self.fstype == "btrfs":
                self.assertEqual(vol_res["type"]["name"], "btrfs subvolume")
            else:
                self.assertEqual(vol_res["type"]["name"], self.fstype)

        return vol_res

    def check_volume_properties(self, vol, max_size=None):
        vol_res = self.check_base_properties(vol, max_size)

        self.assertNotIn("snapshot", vol_res)
        self.assertTrue(vol_res["is_blockvolume"])

        if self.fstype is None:
            self.assertEqual(vol_res["path"], "/dev/%s/gatling_volume" % self._get_pool()["name"])
        else:
            self.assertEqual(vol_res["path"], "/media/gatling_volume")

    def check_snapshot_properties(self, snap, vol_id, max_size=None):
        snap_res = self.check_base_properties(snap, max_size)

        self.assertIn("snapshot", snap_res)
        self.assertIn("id", snap_res["snapshot"])
        self.assertIn("source_pool", snap_res)
        self.assertIn("id", snap_res["source_pool"])
        self.assertEqual(snap_res["source_pool"]["id"], self._get_pool()["id"])
        self.assertEqual(snap_res["snapshot"]["id"], vol_id)

        if self.fstype is None:
            self.assertEqual(snap_res["path"], "/dev/%s/volume_snapshot_made_by_gatling" % self._get_pool()["name"])
        else:
            if self.fstype == "btrfs":
                vol_pool_name = "gatling_btrfs"
            else:
                vol_pool_name = "gatling_volume"

            self.assertIn(snap_res["path"], ["/media/volume_snapshot_made_by_gatling",
                                             ("/media/%s/.snapshots/volume_snapshot_made_by_gatling" % vol_pool_name)])

    def check_clone_properties(self, clone, max_size=None):
        clone_res = self.check_base_properties(clone, max_size)

        self.assertIn("source_pool", clone_res)
        self.assertIn("id", clone_res["source_pool"])
        self.assertEqual(clone_res["source_pool"]["id"], self._get_pool()["id"])

        if "snapshot" in clone_res:
            self.assertIsNone(clone_res["snapshot"])

        if self.fstype is None:
            self.assertEqual(clone_res["path"], "/dev/%s/gatling_clone" % self._get_pool()["name"])
        else:
            self.assertEqual(clone_res["path"], "/media/gatling_clone")

    @classmethod
    def _get_sturctured_prefixes(cls, prefixes):
        structured_prefixes = {
            "api_prefix"    : None,
            "detail_route"  : None,
            "cleanup_route" : None
        }

        if not prefixes:
            try:
                structured_prefixes["api_prefix"] = cls.api_prefix
            except:
                raise unittest.SkipTest("Can't find api_prefix for this testcase.")
        elif isinstance(prefixes, basestring):
            structured_prefixes["api_prefix"] = prefixes
        else:
            try:
                structured_prefixes["api_prefix"] = prefixes[0]
                structured_prefixes["detail_route"] = prefixes[1]

                if len(prefixes) == 3:
                    structured_prefixes["cleanup_route"] = prefixes[2]
            except:
                raise unittest.SkipTest("Received wrong prefixes for this testcase.")

        return structured_prefixes

    @classmethod
    def _get_cleanup_url(cls, obj_id, prefixes):
        base_url = cls.conf.get("options", "connect")

        if prefixes["detail_route"]:
            if prefixes["cleanup_route"]:
                return "%s%s/%s" % (base_url, prefixes["cleanup_route"], str(obj_id))
            else:
                return "%s%s/%s" % (base_url, prefixes["detail_route"], str(obj_id))
        else:
            return "%s%s/%s" % (base_url, prefixes["api_prefix"], str(obj_id))

