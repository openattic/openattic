from piston.handler import BaseHandler
from samba.models import Share

class ShareHandler(BaseHandler):
    model = Share
    exclude = () # un-exclude the 'id' field

    @staticmethod
    def resource_uri():
        return ('api_samba_share_handler', ['id'])

api_handlers = [
    ( (r'samba/shares/(?P<id>\d+)/', r'samba/shares/'), ShareHandler, "api_samba_share_handler" ),
    ]
