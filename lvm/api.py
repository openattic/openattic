from piston.handler import BaseHandler
from lvm.models import VolumeGroup, LogicalVolume

class VGHandler(BaseHandler):
    allowed_methods = ('GET',)
    model = VolumeGroup

    @staticmethod
    def resource_uri():
        return ('api_lvm_vg_handler', ['name'])

class LVHandler(BaseHandler):
    model = LogicalVolume

    @staticmethod
    def resource_uri():
        return ('api_lvm_lv_handler', ['name'])

api_handlers = [
    ( (r'lvm/vgs/(?P<name>\w+)/', r'lvm/vgs/'), VGHandler, 'api_lvm_vg_handler' ),
    ( (r'lvm/lvs/(?P<name>\w+)/', r'lvm/lvs/'), LVHandler, 'api_lvm_lv_handler' ),
    ]
