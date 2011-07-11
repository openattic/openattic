# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import BaseHandler

from samba.models import Share

class ShareHandler(BaseHandler):
    model = Share

RPCD_HANDLERS = [ShareHandler]
