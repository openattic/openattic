# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

import apt
from rpcd.handlers import BaseHandler

class PkgAptHandler(BaseHandler):
    @classmethod
    def _get_handler_name(cls):
        return "pkgapt.Apt"



RPCD_HANDLERS = [PkgAptHandler]
