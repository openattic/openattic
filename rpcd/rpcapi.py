# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import BaseHandler
from django.contrib.auth.models import User, Group

class GroupHandler(BaseHandler):
    model = Group

    def _override_get(self, obj, data):
        h = UserHandler()
        data['members'] = [ h._idobj(member) for member in obj.user_set.all() ]
        return data

class UserHandler(BaseHandler):
    model = User
    exclude = ["password"]

    def _override_get(self, obj, data):
        h = GroupHandler()
        data['groups'] = [ h._idobj(grp) for grp in obj.groups.all() ]
        return data

RPCD_HANDLERS = [GroupHandler, UserHandler]
