# -*- coding: utf-8 -*-

""" PAM Authentication Backend

    For additional info, see man 3 pam and /usr/share/doc/python-pam/examples/pamtest.py.

    Copyright © Michael Ziegler, MEP-OLBO GmbH
"""

import PAM
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models   import User

from django.conf                  import settings

class PamBackend( ModelBackend ):
	""" The PAM authentication backend for Django. """
	
	def __init__( self, *args, **kwargs ):
		ModelBackend.__init__( self, *args, **kwargs )
		self.userPassword = ""
	
	def pam_conversation( self, auth, query_list, userData ):
		""" This method will be called by PAM (authenticate()) to
		    retrieve authentication tokens. We can only answer with
		    the password and hope it works (we don't know anything else).
		"""
		return [ ( self.userPassword, 0 ) ];
	
	def authenticate( self, username=None, password=None ):
		""" Check the username/password and return a User. """
		auth = PAM.pam();
		auth.start( settings.PAM_AUTH_SERVICE );
		
		# For some reason or another, Kerberos requires the username to be all UPPERCASE.
		auth.set_item( PAM.PAM_USER, username.upper() );
		self.userPassword = password;
		auth.set_item( PAM.PAM_CONV, self.pam_conversation );
		
		try:	# This is a bit ugly, but authenticate() doesn't return a status code :(
			auth.authenticate()
			auth.acct_mgmt();
		except PAM.error:
			pass;
		else:
			try:
				return User.objects.get( username=username );
			except User.DoesNotExist:
				pass;
		return None;
	
	def get_user( self, userid ):
		""" Get the user with the given ID, or None if not found. """
		try:
			return User.objects.get( id=userid );
		except User.DoesNotExist:
			return None;
	


