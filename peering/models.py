# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import base64
import httplib
import json
import socket
from urlparse import urlparse

from django.db import models

class PeerHost(models.Model):
    name         = models.CharField(max_length=250)
    base_url     = models.CharField(max_length=250)
    username     = models.CharField(max_length=50)
    password     = models.CharField(max_length=50)

    def __init__( self, *args, **kwargs ):
        models.Model.__init__( self, *args, **kwargs )
        self._connection = None

    @property
    def connection(self):
        if self._connection is None:
            urlinfo = urlparse(self.base_url)
            server = urlinfo.hostname
            port   = urlinfo.port or socket.getservbyname(urlinfo.scheme)
            if urlinfo.scheme == "http":
                self._connection = httplib.HTTPConnection("%s:%d" % (server, port))
            else:
                self._connection = httplib.HTTPSConnection("%s:%d" % (server, port))
        return self._connection

    def get(self, url, body=None, headers={}):
        if not url.lower().startswith("http"):
            url = self.base_url + url
        urlinfo = urlparse(url)
        headers.update({ 'Authorization': "Basic " + base64.encodestring(
            "%s:%s" % (self.username, self.password)
            ) })
        self.connection.request("GET", urlinfo.path, body=body, headers=headers)
        response = self.connection.getresponse()
        res = response.read()
        print "RESPONSE", res
        return res

    def getjson(self, url, body=None, headers={}):
        return json.loads( self.get( url, body, headers ) )
