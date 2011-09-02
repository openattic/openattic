# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import socket

from django.db import models

# Create your models here.
class MuninNode(models.Model):
    name        = models.CharField(max_length=250)
    nodeaddr    = models.CharField(max_length=250, default="localhost")
    nodeport    = models.IntegerField(default=4949)
    imgurl      = models.CharField(max_length=250)

    @property
    def modules(self):
        """ Retrieve a list of running modules from munin-node. """
        addrlist = socket.getaddrinfo( self.nodeaddr, self.nodeport, 0, 0, socket.SOL_TCP )
        for (family, socktype, proto, canonname, sockaddr) in addrlist:
            sock = socket.socket( family, socktype, proto )
            try:
                sock.connect( sockaddr )
                welcome = sock.recv(4096)
                if not welcome.startswith("# munin node at"):
                    raise ReferenceError("%s:%s does not seem to be a Munin node" % (self.nodeaddr, self.nodeport))
                sock.send("list\r\n")
                return sock.recv(4096).strip().split()
            finally:
                sock.close()
        raise ValueError("No more addresses to connect to")

    def get_module_url(self, module, time="day"):
        return self.imgurl % { 'module': module.replace('.', '_'), 'time': time }
