# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.db import models

from lvm.models import LogicalVolume

class Backstore(models.Model):
    volume      = models.ForeignKey(LogicalVolume)
    name        = models.CharField(max_length=250)
    type        = models.CharField(max_length=10, choices=(
                    ("fileio", "fileio"),
                    ("iblock", "iblock"),
                  ))


class Target(models.Model):
    wwn         = models.CharField(max_length=250)
    type        = models.CharField(max_length=10, choices=(
                    ("iscsi",   "iscsi"),
                    ("qla2xxx", "qla2xxx"),
                  ))

class Portal(models.Model):
    pass

class TPG(models.Model):
    target      = models.ForeignKey(Target)
    portal      = models.ForeignKey(Portal, blank=True, null=True)
    chapauth    = models.BooleanField(default=False)


class ACL(models.Model):
    tpg         = models.ForeignKey(TPG)

class LUN(models.Model):
    tpg         = models.ForeignKey(TPG)
    backstore   = models.ForeignKey(Backstore)


