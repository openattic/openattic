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

from django.db.models import signals as models_signals
from django.contrib.contenttypes.models import ContentType

from volumes import models
from volumes import signals as volumes_signals

def _create_vpool(instance, **kwargs):
    vpooltype = ContentType.objects.get_for_model(instance.__class__)
    try:
        vpool = models.VolumePool.objects.get(content_type=vpooltype, object_id=instance.id)
    except models.VolumePool.DoesNotExist:
        vpool = models.VolumePool()
        vpool.volumepool = instance
        vpool.capflags = 0
        volumes_signals.pre_install.send(sender=models.VolumePool, instance=vpool, volumepool=instance)
        vpool.save()
        volumes_signals.post_install.send(sender=models.VolumePool, instance=vpool, volumepool=instance)

def _delete_vpool(instance, **kwargs):
    vpooltype = ContentType.objects.get_for_model(instance.__class__)
    try:
        vpool = models.VolumePool.objects.get(content_type=vpooltype, object_id=instance.id)
    except models.VolumePool.DoesNotExist:
        pass
    else:
        volumes_signals.pre_uninstall.send(sender=models.VolumePool, instance=vpool, volumepool=instance)
        vpool.delete()
        volumes_signals.post_uninstall.send(sender=models.VolumePool, instance=vpool, volumepool=instance)

def VolumePool(model):
    models_signals.post_save.connect(  _create_vpool, sender=model )
    models_signals.pre_delete.connect( _delete_vpool, sender=model )
    return model


def _create_blkvolume(instance, **kwargs):
    volumetype = ContentType.objects.get_for_model(instance.__class__)
    try:
        blkvolume = models.BlockVolume.objects.get(content_type=volumetype, object_id=instance.id)
    except models.BlockVolume.DoesNotExist:
        blkvolume = models.BlockVolume()
        blkvolume.volume = instance
        blkvolume.capflags = 0
        volumes_volumes_signals.pre_install.send(sender=models.BlockVolume, instance=blkvolume, volume=instance)
        blkvolume.save()
        volumes_volumes_signals.post_install.send(sender=models.BlockVolume, instance=blkvolume, volume=instance)

def _delete_blkvolume(instance, **kwargs):
    volumetype = ContentType.objects.get_for_model(instance.__class__)
    try:
        blkvolume = models.BlockVolume.objects.get(content_type=volumetype, object_id=instance.id)
    except models.BlockVolume.DoesNotExist:
        pass
    else:
        volumes_signals.pre_uninstall.send(sender=models.BlockVolume, instance=blkvolume, volume=instance)
        blkvolume.delete()
        volumes_signals.post_uninstall.send(sender=models.BlockVolume, instance=blkvolume, volume=instance)

def BlockVolume(model):
    models_signals.post_save.connect(  _create_blkvolume, sender=model )
    models_signals.pre_delete.connect( _delete_blkvolume, sender=model )
    return model

def _create_fsvolume(instance, **kwargs):
    volumetype = ContentType.objects.get_for_model(instance.__class__)
    try:
        fsvolume = models.FileSystemVolume.objects.get(content_type=volumetype, object_id=instance.id)
    except models.FileSystemVolume.DoesNotExist:
        fsvolume = models.FileSystemVolume()
        fsvolume.volume     = instance
        fsvolume.capflags   = 0
        fsvolume.filesystem = instance.filesystem
        fsvolume.owner      = instance.owner
        fsvolume.fswarning  = instance.fswarning
        fsvolume.fscritical = instance.fscritical
        volumes_signals.pre_install.send(sender=models.FileSystemVolume, instance=fsvolume, volume=instance)
        fsvolume.save()
        volumes_signals.post_install.send(sender=models.FileSystemVolume, instance=fsvolume, volume=instance)

def _delete_fsvolume(instance, **kwargs):
    volumetype = ContentType.objects.get_for_model(instance.__class__)
    try:
        fsvolume = models.FileSystemVolume.objects.get(content_type=volumetype, object_id=instance.id)
    except models.FileSystemVolume.DoesNotExist:
        pass
    else:
        volumes_signals.pre_uninstall.send(sender=models.FileSystemVolume, instance=fsvolume, volume=instance)
        fsvolume.delete()
        volumes_signals.post_uninstall.send(sender=models.FileSystemVolume, instance=fsvolume, volume=instance)

def FileSystemVolume(model):
    models_signals.post_save.connect(  _create_fsvolume, sender=model )
    models_signals.pre_delete.connect( _delete_fsvolume, sender=model )
    return model

def _create_hybridvolume(instance, **kwargs):
    volumetype = ContentType.objects.get_for_model(instance.__class__)
    try:
        blkvolume = models.BlockVolume.objects.get(content_type=volumetype, object_id=instance.id)
    except models.BlockVolume.DoesNotExist:
        blkvolume = models.BlockVolume()
        blkvolume.volume = instance
        blkvolume.capflags = 0
        if not instance.filesystem:
            volumes_signals.pre_install.send(sender=models.BlockVolume, instance=blkvolume, volume=instance)
        blkvolume.save()
        if not instance.filesystem:
            volumes_signals.post_install.send(sender=models.BlockVolume, instance=blkvolume, volume=instance)

    if instance.filesystem:
        blkvolumetype = ContentType.objects.get_for_model(models.BlockVolume)
        try:
            fsvolume = models.FileSystemVolume.objects.get(content_type=blkvolumetype, object_id=blkvolume.id)
        except models.FileSystemVolume.DoesNotExist:
            fsvolume = models.FileSystemVolume()
            fsvolume.volume     = blkvolume
            fsvolume.capflags   = 0
            fsvolume.filesystem = instance.filesystem
            fsvolume.owner      = instance.owner
            fsvolume.fswarning  = instance.fswarning
            fsvolume.fscritical = instance.fscritical
            volumes_signals.pre_install.send(sender=models.FileSystemVolume, instance=fsvolume, volume=instance)
            fsvolume.save()
            volumes_signals.post_install.send(sender=models.FileSystemVolume, instance=fsvolume, volume=instance)

def _delete_hybridvolume(instance, **kwargs):
    volumetype = ContentType.objects.get_for_model(instance.__class__)
    try:
        blkvolume = models.BlockVolume.objects.get(content_type=volumetype, object_id=instance.id)
    except models.BlockVolume.DoesNotExist:
        pass
    else:
        fsvolume = blkvolume.fsvolume
        if fsvolume is not None:
            volumes_signals.pre_uninstall.send(sender=models.FileSystemVolume, instance=fsvolume, volume=instance)
        else:
            volumes_signals.pre_uninstall.send(sender=models.BlockVolume, instance=blkvolume, volume=instance)

        blkvolume.delete()

        if fsvolume is not None:
            fsvolume.delete()
            volumes_signals.post_uninstall.send(sender=models.FileSystemVolume, instance=fsvolume, volume=instance)
        else:
            volumes_signals.post_uninstall.send(sender=models.BlockVolume, instance=blkvolume, volume=instance)

def HybridVolume(model):
    models_signals.post_save.connect(  _create_hybridvolume, sender=model )
    models_signals.pre_delete.connect( _delete_hybridvolume, sender=model )
    return model
