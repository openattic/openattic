# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import ModelHandler

from ftp.models import User, Group, FileLog

class FtpUserHandler(ModelHandler):
    model = User
    exclude = ["passwd", "uid", "gid"]

class FtpGroupHandler(ModelHandler):
    model = Group

class FtpFileLogHandler(ModelHandler):
    model = FileLog

RPCD_HANDLERS = [FtpUserHandler, FtpGroupHandler, FtpFileLogHandler]
