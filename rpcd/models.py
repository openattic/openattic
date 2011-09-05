# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import uuid

from django.contrib.auth.models import User
from django.db import models

class APIKey(models.Model):
    apikey      = models.CharField( max_length=40 )
    owner       = models.ForeignKey( User, blank=True, null=True )
    description = models.CharField( max_length=250 )
    active      = models.BooleanField( default=True, blank=True )

    def save(self, *args, **kwargs):
        if not self.apikey:
            self.apikey = unicode(uuid.uuid4())
        return models.Model.save(self, *args, **kwargs)

