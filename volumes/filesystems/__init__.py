# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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

from volumes.filesystems.filesystem import FileSystemMeta, FileSystem

def __import_filesystems():
    import os
    for module in os.listdir(os.path.dirname(__file__)):
        if module.endswith(".py") and module not in ("__init__.py", "filesystem.py"):
            __import__("volumes.filesystems." + module.replace(".py", ""))

__import_filesystems()

FILESYSTEMS = FileSystemMeta.filesystems

def get_by_name(name):
    """ Return the file system class with the given ``name``. """
    for fs in FILESYSTEMS:
        if fs.name == name:
            return fs
    raise KeyError("No such filesystem found: '%s'" % name)

