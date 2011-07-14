# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import BaseHandler
from django.contrib.auth.models import User, Group

class GroupHandler(BaseHandler):
    model = Group

class UserHandler(BaseHandler):
    model = User
    exclude = ["password"]

    def set_password(self, id, passwd):
        """ Set the password for the given user. """
        return User.objects.get(id=id).set_password(passwd)

RPCD_HANDLERS = [GroupHandler, UserHandler]
