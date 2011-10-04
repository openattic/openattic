# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler
from django.contrib.auth.models import User, Group

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

    def whoami(self):
        """ Return the user we are identified with. """
        return self._getobj(self.user)

RPCD_HANDLERS = [GroupHandler, UserHandler]
