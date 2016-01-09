# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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

from django.contrib.auth.models import User, Group, Permission
from django.contrib.contenttypes.models import ContentType

from rpcd.handlers import ModelHandler
from rpcd.models   import APIKey

class APIKeyHandler(ModelHandler):
    model = APIKey

class PermissionHandler(ModelHandler):
    model = Permission

class GroupHandler(ModelHandler):
    model = Group

    def _override_get(self, obj, data):
        h = UserHandler(self.user)
        data['members'] = [ h._idobj(member) for member in obj.user_set.all() ]
        return data

class UserHandler(ModelHandler):
    model = User

    def _override_get(self, obj, data):
        h = GroupHandler(self.user)
        data['groups'] = [ h._idobj(grp) for grp in obj.groups.all() ]
        return data

    def _override_set(self, obj, data):
        if 'password' in data and data["password"]:
            obj.set_password(data["password"])
        return data

    def whoami(self):
        """ Return the user we are identified with. """
        return self._getobj(self.user)

    def set_password(self, id, password):
        """ Set the passsword for the user given by `id` to `password`. """
        user = User.objects.get(id=id)
        user.set_password(password)
        user.save()

class ContentTypeHandler(ModelHandler):
    model = ContentType

    def _idobj(self, obj):
        model = obj.model_class()
        if model is None:
            raise SystemError("Cannot resolve ContentType '%s.%s' into a model -- check INSTALLED_APPS" % (obj.app_label, obj.model))
        return {
            "app": model._meta.app_label,
            "obj": model._meta.object_name,
            "__unicode__": model._meta.verbose_name
        }

RPCD_HANDLERS = [GroupHandler, UserHandler, APIKeyHandler, PermissionHandler, ContentTypeHandler]
