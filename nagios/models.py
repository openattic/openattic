# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.db import models

class Command(models.Model):
    name        = models.CharField(max_length=250, unique=True)

class Service(models.Model):
    description = models.CharField(max_length=250, unique=True)
    command     = models.ForeignKey(Command)
    arguments   = models.CharField(max_length=500)
