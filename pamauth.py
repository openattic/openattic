# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

""" PAM Authentication Backend

    For additional info, see man 3 pam and /usr/share/doc/python-pam/examples/pamtest.py.

    Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>

    openATTIC is free software; you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation; version 2.

    This package is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
"""

import sys
import PAM
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models   import User

from django.conf                  import settings

class PamBackend( ModelBackend ):
    """ The PAM authentication backend for Django. """

    def __init__( self, service=settings.PAM_AUTH_SERVICE, *args, **kwargs ):
        ModelBackend.__init__( self, *args, **kwargs )
        self.service = service
        self.userPassword = ""

    def pam_conversation( self, auth, query_list, userData ):
        """ This method will be called by PAM (authenticate()) to
            retrieve authentication tokens. We can only answer with
            the password and hope it works (we don't know anything else).
        """
        return [ ( self.userPassword, 0 ) ]

    def authenticate( self, username=None, password=None ):
        """ Check the username/password and return a User. """
        auth = PAM.pam()
        auth.start( self.service )

        # For some reason or another, Kerberos requires the username to be all UPPERCASE.
        if settings.PAM_AUTH_KERBEROS:
            auth.set_item( PAM.PAM_USER, username.upper() )
        else:
            auth.set_item( PAM.PAM_USER, username )
        self.userPassword = password
        auth.set_item( PAM.PAM_CONV, self.pam_conversation )

        try:    # This is a bit ugly, but authenticate() doesn't return a status code :(
            auth.authenticate()
            auth.acct_mgmt()
        except PAM.error, err:
            print >> sys.stderr, "[openATTIC error] PAM Login failed for user '%s': %s" % (username, err)
        else:
            print >> sys.stderr, "[openATTIC notice] PAM Login succeeded for user '%s'" % username
            try:
                return User.objects.get( username=username )
            except User.DoesNotExist:
                pass
        return None

    def get_user( self, userid ):
        """ Get the user with the given ID, or None if not found. """
        try:
            return User.objects.get( id=userid )
        except User.DoesNotExist:
            return None

