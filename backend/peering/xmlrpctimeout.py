# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import xmlrpclib

class TimeoutTransport(xmlrpclib.Transport):
    def __init__(self, use_datetime=0, timeout=30):
        xmlrpclib.Transport.__init__(self, use_datetime)
        self.timeout = timeout

    def make_connection(self, host):
        # The HTTPConnection already supports a timeout, we just need to set it.
        conn = xmlrpclib.Transport.make_connection(self, host)
        conn.timeout = self.timeout
        return conn

    def send_content(self, connection, request_body):
        # this is the very last method that is called before recv() is called.
        # Since we only want the timeout to apply for *connect*, but not for the
        # actual reply, unset it here to prevent the recv() from failing.
        xmlrpclib.Transport.send_content(self, connection, request_body)
        if hasattr(connection, "sock"):
            connection.sock.settimeout(None)

def ServerProxy(url, *args, **kwargs):
    t = TimeoutTransport()
    t.timeout = kwargs.get('timeout', 20)
    if 'timeout' in kwargs:
        del kwargs['timeout']
    kwargs['transport'] = t
    return xmlrpclib.ServerProxy(url, *args, **kwargs)

