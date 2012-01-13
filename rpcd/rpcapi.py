# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from django.contrib.auth.models import User, Group, Permission

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
    exclude = ["password"]

    def _override_get(self, obj, data):
        h = GroupHandler(self.user)
        data['groups'] = [ h._idobj(grp) for grp in obj.groups.all() ]
        return data

    def _override_set(self, obj, data):
        if 'password' in data and data["password"]:
            obj.set_password(data["password"])
        return data

    def _idobj(self, obj):
        """ Return an ID for the given object, including the app label and object name. """
        return {'id': obj.id, 'app': obj._meta.app_label, 'obj': obj._meta.object_name, 'username': obj.username}

    def whoami(self):
        """ Return the user we are identified with. """
        return self._getobj(self.user)

    def set_password(self, id, password):
        """ Set the passsword for the user given by `id` to `password`. """
        user = User.objects.get(id=id)
        user.set_password(password)
        user.save()


RPCD_HANDLERS = [GroupHandler, UserHandler, APIKeyHandler, PermissionHandler]
