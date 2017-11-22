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

from requests.auth import HTTPBasicAuth


class GatlingTestCase(unittest.TestCase):

    conf = None
    base_url = ''
    api_prefix = ''

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
    def send_api_request(cls, method, url_suffix=None, data=None, params=None, headers=None):
        """
        Provides more control for requests compared to send_request().

        This method is ment to be used for API calls where Django isn't involved and thus, the
        results do not match a specific pattern. For Django specific requests use the
        `send_request()` method.

        :param method: Either POST, PUT, DELETE or GET
        :param url_suffix: Suffix for the URL
        :param data: Data for the body of the request
        :param params: Parameters for the request
        :param headers: Headers of the request
        :return:
        """
        url = cls.base_url + cls.api_prefix + ('/' + url_suffix if url_suffix else '')

        if not headers:
            headers = {}

        if 'content-type' not in headers:
            headers['content-type'] = 'application/json'

        headers.update(cls.get_auth_header())  # Always authenticate

        if method.upper() in ['POST', 'GET', 'PUT', 'DELETE']:
            return cls._do_request(method, url, headers, data=data, params=params)
        else:
            raise NotImplementedError('Unknown request method \'{}\''.format(method))

    @classmethod
    def send_request(cls, method, prefixes=None, auth_token=None, username=None, password=None,
                     data=None, obj_id=None, search_param=None):
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
        :param username (str): Optional parameter. For another needed username than the one defined
                               in the config. Note: if username + password AND auth_token are given
                               username and password will be used for the request.
        :param password (str): Optional parameter. For another needed password than the one defined
                               in the config. Note: if username + password AND auth_token are given
                               username and password will be used for the request.
        :param data (dict): Data for creating a new object by POST request.
        :param obj_id (int): Object id to get a specific object by GET request.
        :param search_param (str): Search param, e.g.: "name=vol_name" to search for a specific
                                   volume. It generates the following url:
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
        prefixes = cls._get_structured_prefixes(prefixes)
        url = '{}{}'.format(cls.base_url, prefixes['api_prefix'])

        if obj_id:
            url = '{}/{}'.format(url, obj_id)

        header = dict()
        header['content-type'] = 'application/json'
        auth = None

        if not (username and password):
            header.update(cls.get_auth_header(auth_token))
        else:
            auth = HTTPBasicAuth(username, password)

        # POST, PUT
        if method in ['POST', 'PUT']:
            if prefixes['detail_route']:
                url = '{}/{}'.format(url, prefixes['detail_route'])

            res = cls._do_request(method, url, header, data=data, auth=auth)
            res = json.loads(res.text)

            return {'response': res,
                    'count': 1,
                    'cleanup_url': cls._get_cleanup_url(res['id'], prefixes),
                    'headers': header}
        # GET, DELETE
        elif method in ['GET', 'DELETE']:
            if search_param:
                url = '{}?{}'.format(url, search_param)

            res = cls._do_request(method, url, header, data=data, auth=auth)

            # For method DELETE no json object could be decoded, so just return the response
            # otherwise return the result dict
            try:
                res = json.loads(res.text)
            except:
                return {'response': res}
            else:
                if obj_id:
                    header['content-type'] = 'application/json'
                    return {'response': res,
                            'count': 1,
                            'cleanup_url': url,
                            'headers': header}
                else:
                    return {'response': res['results'],
                            'count': res['count']}
        else:
            print('Unknown request method \'{}\''.format(method))
            raise unittest.SkipTest('Unknown request method \'{}\''.format(method))

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

    def check_exception_messages(self, err_response, expected_message, **kwargs):
        """
        Checks the content of error responses.

        :param err_response: Error response object
        :rtype: HTTPError
        :param expected_message: Expected response message
        :rtype: str
        :param kwargs:  field(str)          -> Which field of the error response should be checked?
                                               Default value is detail.
                        fuzzy(bool)         -> Checks just a part of the error message (uses
                                               assertIn instead of assertEqual). Default value is
                                               False.
                        status_code(int)    -> Checks error response for this status code. Default
                                               value is 400.
        :rtype: dict[str, Any]
        :return: None
        """
        field = kwargs.get("field", "detail")
        fuzzy = kwargs.get("fuzzy", False)
        status_code = kwargs.get("status_code", 400)

        # Validate the response status code.
        self.assertEqual(err_response.exception.response.status_code, status_code)

        # Validate the response message.
        expected_message = expected_message.lower()
        detailed_err = err_response.exception.response.json()[field]
        if type(detailed_err) == list:
            message = str(detailed_err[0]).lower()
        else:
            message = detailed_err.lower()

        if fuzzy:
            self.assertIn(expected_message, message)
        else:
            self.assertEqual(expected_message, message)

    @classmethod
    def _get_structured_prefixes(cls, prefixes):
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
            if cls.api_prefix:
                structured_prefixes["api_prefix"] = cls.api_prefix
            else:
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

    @classmethod
    def _do_request(cls, method, url, headers, data=None, auth=None, params=None):
        """
        Helper function to send the request to the REST API.

        :param method: HTTP method of the request
        :type method: str
        :param url: Request url
        :type url: str
        :param headers: Request headers
        :type headers: dict[str, str]
        :param data: Request data
        :type data: dict[str, Any]
        :param auth: Basic auth object of username and password
        :type auth: requests.HTTPBasicAuth
        :return: Returns the response of the request
        :rtype: requests.response

        """
        if data:
            data = json.dumps(data)

        res = requests.request(method, url, headers=headers, data=data, auth=auth, params=params)

        try:
            res.raise_for_status()
        except requests.exceptions.HTTPError as e:
            # Modify the error message and re-raise the exception.
            raise requests.exceptions.HTTPError("{} content: {}".format(str(e), res.text),
                                                response=e.response,
                                                request=e.request)
        return res

    @classmethod
    def send_ceph_request(cls, method, fsid, subresource=None, data=None, search_param=None):
        """
        Helper function to send the request to the Ceph REST API.

        :param method: HTTP method of the request
        :type method: str
        :param fsid: Ceph cluster fsid
        :type method: str
        :param subresource: Resource under /ceph/<fsid> that should be called
        :type method: str
        :param data: Request data
        :type data: dict[str, Any]
        :return: Returns the response of the request
        :rtype: requests.response
        """
        url = '{}{}/{}'.format(cls.base_url, 'ceph', fsid)

        if subresource:
            url = '{}/{}'.format(url, subresource)

        if search_param:
            url = '{}?{}'.format(url, search_param)


        headers = dict()
        headers['content-type'] = 'application/json'
        headers.update(cls.get_auth_header())

        res = cls._do_request(method, url, headers, data=data)
        try:
            return {'response': res.json(), 'status_code': res.status_code}
        except:
            return {'response': res.text, 'status_code': res.status_code}
