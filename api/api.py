from django.contrib.auth.models import User, Group
from piston.handler import BaseHandler

class UserHandler(BaseHandler):
    allowed_methods = ('GET',)
    model = User
    exclude = ('id', 'password', '_state')

    @staticmethod
    def resource_uri():
        return ('api_user_handler', ['username'])

class GroupHandler(BaseHandler):
    allowed_methods = ('GET',)
    model = Group

    @staticmethod
    def resource_uri():
        return ('api_group_handler', ['name'])

api_handlers = [
    ( (r'accounts/users/(?P<username>\w+)/', r'accounts/users/' ), UserHandler,  'api_user_handler'  ),
    ( (r'accounts/groups/(?P<name>\w+)/',    r'accounts/groups/'), GroupHandler, 'api_group_handler' ),
    ]
