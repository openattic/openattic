# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
 *
 *  openATTIC is free software; you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; version 2.
 *
 *  This package is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
"""

import socket

from django.template.loader import render_to_string

from systemd.procutils import service_command, invoke
from systemd.plugins import logged, BasePlugin, deferredmethod
from samba.models import Share
from samba.conf import settings as samba_settings


@logged
class SystemD(BasePlugin):
    dbus_path = "/samba"

    @deferredmethod(in_signature="ssbi")
    def writeconf(self, fake_domain, fake_workgroup, delete, id, sender):
        """
        Writes all known Samba shares into /etc/samba/smb.conf. The deletion of entries is handled
        by this method as well because is just refreshes the whole /etc/samba/smb.conf file.

        The parameters 'delete' and 'id' are needed if the method is called by a post_delete signal
        (see Jira issue OP-736 for more information).
        The Samba share of the deleted volume still exists during this signal but isn't allowed to
        be added to /etc/samba/smb.conf again.
        Handling this situation by one Parameter only is not possible because the DBUS protocol
        doesn't accept optional parameters or None.

        :param fake_domain (str): Needed for domain join
        :param fake_workgroup (str): Needed for domain join
        :param delete (bool): Does the current call delete a samba share? If yes there might be an
            object that should be skipped.
        :param id (int): Delete-calls: ID of the object that should be skipped and not be added to
            the samba config again.
            Save-calls: Any other Integer value (because the DBUS protocol doesn't accept optional
            parameters or None) - you could choose for example 0.
        :param sender: Unique ID of DBUS sender object

        :return: None
        """

        if delete:
            shares = Share.objects.exclude(id=id)
        else:
            shares = Share.objects.all()

        fd = open(samba_settings.SMB_CONF, "wb")
        try:
            fd.write(render_to_string("samba/smb.conf", {
                'Hostname': socket.gethostname(),
                'Domain': samba_settings.DOMAIN or fake_domain,
                'Workgroup': samba_settings.WORKGROUP or fake_workgroup,
                'Shares': shares
                }).encode("UTF-8"))
        finally:
            fd.close()

    @deferredmethod(in_signature="")
    def reload(self, sender):
        return service_command(samba_settings.SERVICE_NAME, "reload")

    @deferredmethod(in_signature="s")
    def fs_chmod(self, path, sender):
        invoke(["/bin/chmod", "-R", "777", path])
