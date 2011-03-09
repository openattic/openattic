from piston.handler import BaseHandler
from nfs.models import Export

class ExportHandler(BaseHandler):
    model = Export
    exclude = () # un-exclude the 'id' field

    @staticmethod
    def resource_uri():
        return ('api_nfs_export_handler', ['id'])

api_handlers = [
    ( (r'nfs/exports/(?P<id>\d+)/', r'nfs/exports/'), ExportHandler, "api_nfs_export_handler" ),
    ]
