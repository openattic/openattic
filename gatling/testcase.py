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

import unittest
import requests
import json


class GatlingTestCase(unittest.TestCase):

    @classmethod
    def require_config(cls, section, *options):
        """
        Make sure the given config section defines the given set of options.
        Otherwise, skip the test case.
        """
        if not cls.conf.has_section(section):
            raise unittest.SkipTest("missing config section %s" % section)
        for option in options:
            if not cls.conf.has_option(section, option):
                raise unittest.SkipTest("missing config option %s in section %s" %
                                        (option, section))

    @classmethod
    def require_enabled(cls, section):
        """
        Make sure the given config section defines an "enabled" option set to "yes".
        Otherwise, skip the test case.
        """
        cls.require_config(section, "enabled")
        if not cls.conf.getboolean(section, "enabled"):
            raise unittest.SkipTest("%s tests disabled in configuration" % section)

    @classmethod
    def setUpClass(cls):
        try:
            res = cls.send_request("GET", "users", search_param="username=openattic")
        except requests.HTTPError:
            raise unittest.SkipTest("openATTIC REST api login failed. Check api url and"
                                    "authentication token")
        else:
            if res["count"] == 0:
                raise unittest.SkipTest("admin user not found")
            cls.userid = res["response"][0]["id"]

    @classmethod
    def send_request(cls, method, prefixes=None, auth_token=None, *args, **kwargs):
        """
        Sends a request to openATTICs REST API and returns the response

        :param method (str): HTTP-method: POST, PUT, GET, DELETE
        :param prefixes (array of str): Optional parameter. Defaults to None. If prefixes is None,
            the class must define a api_prefix class-variable otherwise the test will be skipped.
            Must contain at least 1 and at most 3 REST API navigation prefixes. The first string is
            the first navigation parameter. The second string is the subnavigation parameter in
            case of detail routes. The last parameter is the navigation parameter used by the
            cleanup_url.

            If the array contains only one prefix, this prefix is used in all three cases.
            If the array contains two prefixes, the second prefix is also used by the cleanup_url.

            Examples:
                ["volumes"]                         ->  http://host/openattic/api/volumes
                                                        and returns
                                                        http://host/openattic/api/volumes/vol_id
                ["volumes", "snapshots"]            ->  http://host/openattic/api/volumes/vol_id/
                                                                                          snapshots
                                                        and returns
                                                        http://host/openattic/api/snapshots/snap_id
                ["snapshots", "clone", "volumes"]   ->  http://host/openattic/api/snapshots/snap_id
                                                                                             /clone
                                                        and returns
                                                        http://host/openattic/api/volumes/vol_id
        :param auth_token (str): Optional parameter. For other needed authentication tokens than
                                 the defined one in the config. The request will be send with
                                 with this authentication token instead of the token defined in
                                 the config.
        :param args: None
        :param kwargs:  obj_id (int)      -> Object id to get a specific object by GET request.
                        data (dict)       -> Data for creating a new object by POST request.
                        search_param (str)-> Search param, e.g.: "name=vol_name" to search for a
                                             specific volume.
                                             It generates the following url:
                                             http://host/openattic/api/volumes?name=vol_name
        :return: In case of:
            -   POST and PUT requests: A dictionary {"response": api_response, "count": 1,
                "cleanup_url": cleanup_url, "headers": creation headers}
            -   DELETE requests: A dictionary {"response": api_response, "count": 1,
                "cleanup_url": cleanup_url, "headers": creation headers}
            -   GET requests: For a specific objects a dictionary {"response": api_response,
                "count": 1, "cleanup_url": cleanup_url, "headers": creation headers}. For a list of
                objects a dictionary {"response": api_response, "count": sum of returned objects}
        """
        prefixes = cls._get_sturctured_prefixes(prefixes)
        header = cls.get_auth_header(auth_token)
        url = "%s%s" % (cls.base_url, prefixes["api_prefix"])

        if "obj_id" in kwargs:
            url = "%s/%s" % (url, str(kwargs["obj_id"]))

        # POST, PUT
        if method in ["POST", "PUT"]:
            if prefixes["detail_route"]:
                url = "%s/%s" % (url, prefixes["detail_route"])

            header["content-type"] = "application/json"

            data = kwargs.get("data", None)

            res = requests.request(method, url, data=json.dumps(data), headers=header)
            res.raise_for_status()
            res = json.loads(res.text)

            return {"response": res,
                    "count": 1,
                    "cleanup_url": cls._get_cleanup_url(res["id"], prefixes),
                    "headers": header}
        # GET, DELETE
        elif method in ["GET", "DELETE"]:
            if "search_param" in kwargs:
                url = "%s?%s" % (url, kwargs["search_param"])
            res = requests.request(method, url, headers=header)
            res.raise_for_status()

            # For method DELETE no json object could be decoded, so just return the response
            # otherwise return the result dict
            try:
                res = json.loads(res.text)
            except:
                return {"response": res}
            else:
                if "obj_id" in kwargs:
                    header["content-type"] = "application/json"
                    return {"response": res,
                            "count": 1,
                            "cleanup_url": url,
                            "headers": header}
                else:
                    return {"response": res["results"],
                            "count": res["count"]}
        else:
            print "Unknown request method '%s'" % method
            raise unittest.SkipTest("Unknown request method '%s'" % method)

    @classmethod
    def get_auth_header(cls, auth_token=None):
        """
        Returns the needed authorization header for requests. The authorization header includes the
        auth token generated by django.

        :param auth_token (str): Optional parameter. For other needed authentication tokens than the
                                 defined one in the config.
        :return: Dictionary containing the authorization header
        """

        if not auth_token:
            auth_token = cls.get_auth_token()
        return {"Authorization": "Token %s" % auth_token}

    @classmethod
    def get_auth_token(cls, **kwargs):
        """
        Returns the auth token for a given user by username and password. If username and/or
        password are not included in kwargs, Gatling tries to get them from the configuration file.

        :param kwargs:  username(str)   -> Name of the user
                        password(str)   -> Password of the user
        :return: Auth token for the given user
        """
        request_url = cls.base_url + "api-token-auth"
        username = kwargs.get("username", cls.conf.get("options", "admin"))
        password = kwargs.get("password", cls.conf.get("options", "password"))

        res = requests.post(request_url, data={"username": username, "password": password})
        res.raise_for_status()
        return res.json()["token"]

    @classmethod
    def delete_old_existing_gatling_volumes(cls):
        """
        Searches for old existing gatling volumes that were not deleted correctly by the last test
        case and removes them.

        :return: None
        """
        for name in ["gatling_volume", "gatling_clone", "volume_snapshot_made_by_gatling"]:
            res = cls.send_request("GET", "volumes", search_param=("name=%s" % name))
            if res["count"] > 0:
                for vol in res["response"]:
                    cls.send_request("DELETE", "volumes", obj_id=vol["id"])

    def check_volume_properties(self, vol, max_size=None):
        """
        Checks the volume specific properties.

        :param vol (dict): Response dictionary given by the REST api.
        :param max_size (int): Optional parameter. Default is None. Allowed maximum size of the
                               volume.
        :return:  None
        """
        vol_res = self._check_base_properties(vol, max_size)

        self.assertNotIn("snapshot", vol_res)

        if self.fstype is None:
            self.assertIn(vol_res["path"], ["/dev/%s/gatling_volume" % self._get_pool()["name"],
                                            "/dev/zvol/%s/gatling_volume" %
                                            self._get_pool()["name"]])
        else:
            if self.fstype == "btrfs":
                self.assertEqual(vol_res["path"], "/media/gatling_btrfs/gatling_volume")
            elif self.fstype == "zfs":
                self.assertEqual(vol_res["path"], "/media/%s/gatling_volume" %
                                 self._get_pool()["name"])
            else:
                self.assertEqual(vol_res["path"], "/media/gatling_volume")

    def check_snapshot_properties(self, snap, vol_id, max_size=None):
        """
        Checks the snapshot specific properties.

        :param snap (dict): Response dictionary given by the REST api.
        :param vol_id (int): ID of the related volume.
        :param max_size (int): Optional parameter. Default is None. Allowed maximum size of the
                               snapshot.
        :return: None
        """
        snap_res = self._check_base_properties(snap, max_size)

        self.assertIn("snapshot", snap_res)
        self.assertIn("id", snap_res["snapshot"])
        self.assertIn("source_pool", snap_res)
        self.assertIn("id", snap_res["source_pool"])
        self.assertEqual(snap_res["source_pool"]["id"], self._get_pool()["id"])
        self.assertEqual(snap_res["snapshot"]["id"], vol_id)

        if self.fstype is None:
            self.assertIn(snap_res["path"],
                          ["/dev/%s/volume_snapshot_made_by_gatling" %
                           self._get_pool()["name"],
                           "/dev/zvol/%s/gatling_volume@volume_snapshot_made_by_gatling" %
                           self._get_pool()["name"]])
        else:
            self.assertIn(snap_res["path"],
                          ["/media/volume_snapshot_made_by_gatling",
                           "/media/gatling_volume/.snapshots/volume_snapshot_made_by_gatling",
                           ("/media/%s/.snapshots/volume_snapshot_made_by_gatling" %
                            self._get_pool()["name"])])

    def check_clone_properties(self, clone, max_size=None):
        """
        Checks the clone specific properties.

        :param clone (dict): Response dictionary given by the REST api.
        :param max_size (int): Optional parameter. Default is None. Allowed maximum size of the
                               clone.
        :return: None
        """
        clone_res = self._check_base_properties(clone, max_size)

        self.assertIn("source_pool", clone_res)
        self.assertIn("id", clone_res["source_pool"])
        self.assertEqual(clone_res["source_pool"]["id"], self._get_pool()["id"])

        if "snapshot" in clone_res:
            self.assertIsNone(clone_res["snapshot"])

        if self.fstype is None:
            self.assertIn(clone_res["path"], ["/dev/%s/gatling_clone" % self._get_pool()["name"],
                                              "/dev/zvol/%s/gatling_clone" %
                                              self._get_pool()["name"]])
        else:
            self.assertEqual(clone_res["path"], "/media/gatling_clone")

    def _check_base_properties(self, vol, max_size):
        """
        Checks the general properties belonging to a volume, snapshot or clone like size, status or
        is_volumepool.

        :param vol (dict): Response dictionary given by the REST api.
        :param max_size (int): Allowed maximum size of the volume. If max_size is None the
                               smallsize is taken instead.
        :return: The "response" key value of the given dictionary.
        """
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
            self.assertTrue(vol_res["is_blockvolume"])
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

    @classmethod
    def _get_sturctured_prefixes(cls, prefixes):
        """
        Helper function to transfer the array of prefixes into a dictionary that contains the keys
        api_prefix, detail_route and cleanup_route and the related values if given.

        :param prefixes (array of str): Array containing the needed prefixes.
        :return: Dictionary containing the keys api_prefix, detail_route and cleanup_route and
                 their values if given.
        """
        structured_prefixes = {
            "api_prefix": None,
            "detail_route": None,
            "cleanup_route": None
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
        """
        Helper function to get the correct cleanup_url.

        :param obj_id (int): Id of the object that should be cleaned up.
        :param prefixes (array of str): Array containing the available prefixes.
        :return: The correct cleanup_url.
        """

        if prefixes["detail_route"]:
            if prefixes["cleanup_route"]:
                return "%s%s/%s" % (cls.base_url, prefixes["cleanup_route"], str(obj_id))
            else:
                return "%s%s/%s" % (cls.base_url, prefixes["detail_route"], str(obj_id))
        else:
            return "%s%s/%s" % (cls.base_url, prefixes["api_prefix"], str(obj_id))
