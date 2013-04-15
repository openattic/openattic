# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
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

import uuid

from django.contrib.auth.models import User
from django.db import models

class APIKey(models.Model):
    apikey      = models.CharField( max_length=40 )
    owner       = models.ForeignKey( User, blank=True, null=True )
    description = models.CharField( max_length=250 )
    active      = models.BooleanField( default=True, blank=True )

    def full_clean(self):
        if not self.apikey:
            self.apikey = unicode(uuid.uuid4())
        return models.Model.full_clean(self)


import new
import hashlib
from django.db.models import signals
from django.contrib.auth import models as auth_models
from django.utils.encoding import smart_str
# http://djangosnippets.org/snippets/389/

def replace_set_password(instance=None, **kwargs):
    """ Replace the standard *_password functions in the auth model. """

    oldcheck = instance.check_password

    def check_password_crypt(self, raw_password):
        """ See if the current password was stored in Django format, and if not,
            auth using the PAM compatible SHA1 hash.
        """
        if '$' in self.password:
            return oldcheck(raw_password)
        return str(hashlib.sha1( smart_str(raw_password) ).hexdigest()) == self.password

    instance.check_password = new.instancemethod(
        check_password_crypt, instance, instance.__class__)

signals.post_init.connect(replace_set_password, sender=auth_models.User)
