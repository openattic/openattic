# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *   Copyright (c) 2017 SUSE LLC
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

import logging
import requests
from requests import ConnectionError

logger = logging.getLogger(__name__)


class RequestException(Exception):
    def __init__(self, message, status_code):
        super(RequestException, self).__init__(message)
        self.status_code = status_code


class BadResponseFormatException(RequestException):
    def __init__(self, message):
        super(BadResponseFormatException, self).__init__(
            "Bad response format" if message is None else message, None)


class _ResponseValidator(object):
    """Simple JSON schema validator

    This class implements a very simple validator for the JSON formatted messages received by
    request responses from a RestClient instance.

    The validator validates the JSON response against a "structure" string that specifies the
    structure that the JSON response must comply.
    The validation procedure raises a BadResponseFormatException in case of a validation failure.

    The structure syntax is given by the following grammar:

    Structure  ::=  Level
    Level      ::=  Path | Path '&' Level
    Path       ::=  Step | Step '>'+ Path
    Step       ::=  Key  | '?' Key | '*' | '(' Level ')'
    Key        ::=  <string> | <string> Array
    Array      ::=  '[' <int> ']' | '[' '*' ']'

    The symbols enclosed in ' ' are tokens of the language, and the + symbol denotes repetition of
    of the preceding token at least once.

    Examples of usage:

    Example 1:
        Validator args:
            structure = "return > *"
            response = { 'return': { ... } }

        In the above example the structure will validate against any response that contains a key
        named "return" in the root of the response dictionary and its value is also a dictionary.

    Example 2:
        Validator args:
            structure = "return[*]"
            response = { 'return': [....] }

        In the above example the structure will validate against any response that contains a key
        named "return" in the root of the response dictionary and its value is an array.

    Example 3:
        Validator args:
            structure = "return[0] > token"
            response = { 'return': [ { 'token': .... } ] }

        In the above example the structure will validate against any response that contains a key
        named "return" in the root of the response dictionary and its value is an array, and
        the first element of the array is a dictionary that contains the key 'token'.

    Example 4:
        Validator args:
            structure = "return > (key1[*] & key2 & ?key3 > subkey)"
            response = { 'return': { 'key1': [...], 'key2: .... } ] }

        In the above example the structure will validate against any response that contains a key
        named "return" in the root of the response dictionary and its value is a dictionary that
        must contain a key named "key1" that is an array, a key named "key2", and optionaly a key
        named "key3" that is a dictionary that contains a key named "subkey".

    Example 5:
        Validator args:
            structure = "return >> roles[*]"
            response = { 'return': { 'key1': { 'roles': [...] }, 'key2': { 'roles': [...] } } }

        In the above example the structure will validate against any response that contains a key
        named "return" in the root of the response dictionary, and its value is a dictionary that
        for any key present in the dictionary their value is also a dictionary that must contain
        a key named 'roles' that is an array.
        Please note that you can use any number of successive '>' to denote the level in the JSON
        tree that you want to match next step in the path.

    """

    @staticmethod
    def validate(structure, response):
        if structure is None:
            return

        _ResponseValidator.__validate_level(structure, response)

    @staticmethod
    def __validate_level(level, resp):
        if not isinstance(resp, dict):
            raise BadResponseFormatException("{} is not a dict".format(resp))

        paths = _ResponseValidator.__parse_level_paths(level)
        for path in paths:
            path_sep = path.find('>')
            if path_sep != -1:
                level_next = path[path_sep + 1:].strip()
            else:
                path_sep = len(path)
                level_next = None
            key = path[:path_sep].strip()

            if key == '*':
                continue
            elif key == '':  # check all keys
                for k in resp.keys():
                    _ResponseValidator.__validate_key(k, level_next, resp)
            else:
                _ResponseValidator.__validate_key(key, level_next, resp)

    @staticmethod
    def __validate_key(key, level_next, resp):
        array_access = [a.strip() for a in key.split("[")]
        key = array_access[0]
        optional = key[0] == '?'
        if optional:
            key = key[1:]
        if key not in resp:
            if optional:
                return
            raise BadResponseFormatException("key {} is not in dict {}".format(key, resp))
        resp_next = resp[key]
        if len(array_access) > 1:
            if not isinstance(resp_next, list):
                raise BadResponseFormatException("{} is not an array".format(resp_next))
            if array_access[1][:-1].isdigit():
                resp_next = resp_next[int(array_access[1][:-1])]

        if level_next is not None:
            _ResponseValidator.__validate_level(level_next, resp_next)

    @staticmethod
    def __parse_level_paths(level):
        level = level.strip()
        if level[0] == '(':
            level = level[1:]
            if level[-1] == ')':
                level = level[:-1]

        paths = []
        lp = 0
        nested = 0
        for i, c in enumerate(level):
            if c == '&' and nested == 0:
                paths.append(level[lp:i].strip())
                lp = i + 1
            elif c == '(':
                nested += 1
            elif c == ')':
                nested -= 1
        paths.append(level[lp:].strip())
        return paths


class _Request(object):
    def __init__(self, method, path, rest_client, resp_structure):
        self.method = method
        self.path = path
        self.rest_client = rest_client
        self.resp_structure = resp_structure

    def __call__(self, data=None):
        if self.method == "get":
            resp = self.rest_client.get(self.path)
        else:
            resp = self.rest_client.post(self.path, data)

        _ResponseValidator.validate(self.resp_structure, resp)
        return resp


class RestClient(object):
    def __init__(self, host, port, client_name=None):
        self.client_name = client_name if client_name else ''
        self.base_url = 'http://{}:{}'.format(host, port)
        logger.debug("REST service base URL: %s", self.base_url)
        self.headers = {'Accept': 'application/json'}
        self.session = requests.Session()

    def _login(self, request=None):
        pass

    def _is_logged_in(self):
        return True

    def _reset_login(self):
        pass

    def is_service_online(self, request=None):
        pass

    @staticmethod
    def requires_login(func):
        def func_wrapper(self, *args, **kwargs):
            retries = 2
            while True:
                try:
                    if not self._is_logged_in():
                        self._login()
                    resp = func(self, *args, **kwargs)
                    return resp
                except RequestException as e:
                    if isinstance(e, BadResponseFormatException):
                        raise e
                    retries -= 1
                    if e.status_code != 401 or retries == 0:
                        raise e
                    self._reset_login()

        return func_wrapper

    def get(self, path):
        logger.debug('%s REST API GET req: %s', self.client_name, path)
        try:
            resp = self.session.get('{}{}'.format(self.base_url, path), headers=self.headers)
            if resp.ok:
                logger.debug("%s REST API GET res status: %s content: %s", self.client_name,
                             resp.status_code, resp.json())
                return resp.json()
            else:
                logger.error("%s REST API failed GET req status: %s", self.client_name,
                             resp.status_code)
                raise RequestException("{} REST API failed request with status code {}"
                                       .format(self.client_name, resp.status_code),
                                       resp.status_code)
        except ConnectionError:
            logger.error("%s REST API failed GET, connection error", self.client_name)
            raise RequestException("{} REST API cannot be reached. Please check your "
                                   "configuration and that the API endpoint is accessible"
                                   .format(self.client_name), None)

    def post(self, path, data=None):
        logger.debug('%s REST API POST req: %s data: %s', self.client_name, path, data)
        try:
            resp = self.session.post('{}{}'.format(self.base_url, path), headers=self.headers,
                                     data=data)

            if resp.ok:
                logger.debug("%s REST API POST res status: %s content: %s", self.client_name,
                             resp.status_code, resp.json())
                return resp.json()
            else:
                logger.error("%s REST API POST failed req status: %s", self.client_name,
                             resp.status_code)
                raise RequestException("{} REST API failed request with status code {}"
                                       .format(self.client_name, resp.status_code),
                                       resp.status_code)
        except ConnectionError:
            logger.error("%s REST API failed POST, connection error", self.client_name)
            raise RequestException("{} REST API cannot be reached. Please check your "
                                   "configuration and that the API endpoint is accessible"
                                   .format(self.client_name), None)

    @staticmethod
    def api_get(path, resp_structure=None):
        def call_decorator(func):
            def func_wrapper(self):
                return func(self, request=_Request("get", path, self, resp_structure))
            return func_wrapper
        return call_decorator

    @staticmethod
    def api_post(path, resp_structure=None):
        def call_decorator(func):
            def func_wrapper(self, *args, **kwargs):
                return func(self, *args, request=_Request("post", path, self, resp_structure),
                            **kwargs)
            return func_wrapper
        return call_decorator
