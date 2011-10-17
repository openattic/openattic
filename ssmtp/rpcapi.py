# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler

from ssmtp.models import SSMTP

class SSMTPHandler(ModelHandler):
    model = SSMTP


RPCD_HANDLERS = [SSMTPHandler]
