# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

""" PAM Authentication Backend

    For additional info, see man 3 pam and /usr/share/doc/python-pam/examples/pamtest.py.

    Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>

    openATTIC is free software; you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation; version 2.

    This package is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
"""

import logging
import sys
import PAM

from django.contrib.auth          import get_user_model
from django.contrib.auth.backends import ModelBackend

from django.conf                  import settings

class PamBackend( ModelBackend ):
    """ PAM authentication backend for Django.

        This backend's implementation works somewhat like RemoteUserBackend
        (see https://docs.djangoproject.com/en/dev/howto/auth-remote-user/). It
        supports create_unknown_user, clean_username and configure_user overrides
        just like RemoteUserBackend does and employs the same mechanisms for
        user authentication and creation.
    """

    # Create a User object if not already in the database?
    create_unknown_user = True

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
        user = None

        auth = PAM.pam()
        auth.start( self.service )

        self.userPassword = password
        auth.set_item( PAM.PAM_USER, self.clean_username(username) )
        auth.set_item( PAM.PAM_CONV, self.pam_conversation )

        try:    # This is a bit ugly, but authenticate() doesn't return a status code :(
            auth.authenticate()
            auth.acct_mgmt()
        except PAM.error, err:
            logging.error("PAM Login failed for user '%s': %s" % (username, err))
        else:
            logging.warning("PAM Login succeeded for user '%s'" % username)

            UserModel = get_user_model()

            # See the implementation of RemoteUserBackend for details.
            if self.create_unknown_user:
                user, created = UserModel.objects.get_or_create(**{
                    UserModel.USERNAME_FIELD: username
                })
                if created:
                    user = self.configure_user(user)
            else:
                try:
                    user = UserModel.objects.get_by_natural_key(username)
                except UserModel.DoesNotExist:
                    pass

        return user

    def clean_username(self, username):
        """ Performs any cleaning on the "username" prior to using it to get or
            create the user object.  Returns the cleaned username.

            By default, returns the username unchanged, unless PAM_AUTH_KERBEROS
            is set to True; then the username is converted to upper case.
        """
        # For some reason or another, Kerberos requires the username to be all UPPERCASE.
        if settings.PAM_AUTH_KERBEROS:
            return username.upper()
        return username

    def configure_user(self, user):
        """ Configures a user after creation and returns the updated user.

            By default, returns the user unmodified.
        """
        return user
