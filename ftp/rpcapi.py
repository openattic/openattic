# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

from rpcd.handlers import BaseHandler

from ftp.models import User, Group, FileLog

class FtpUserHandler(BaseHandler):
    model = User
    exclude = ["passwd", "uid", "gid"]

class FtpGroupHandler(BaseHandler):
    model = Group

class FtpFileLogHandler(BaseHandler):
    model = FileLog

RPCD_HANDLERS = [FtpUserHandler, FtpGroupHandler, FtpFileLogHandler]
