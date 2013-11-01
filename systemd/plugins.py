# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2012, it-novum GmbH <community@open-attic.org>
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

import dbus.service
from functools     import partial, wraps
from threading     import Lock

from django.conf   import settings

class BasePlugin(dbus.service.Object):
    """ Basic SystemD plugin that handles DBus object initialization properly.

        Classes that inherit from this class MUST define a `dbus_path` property,
        in which the object path is defined under which this object is to be exported.
    """
    def __init__(self, bus, busname, mainobj):
        self.bus     = bus
        self.busname = busname
        self.mainobj = mainobj
        dbus.service.Object.__init__(self, self.bus, self.dbus_path)

    def job_add_command(self, jid, cmd):
        """ Add the given command to the job queue with Job ID `jid`. """
        return self.mainobj._job_add_command(jid, cmd)

class LockingPlugin(BasePlugin):
    """ SystemD plugin with a threading.Lock instance available at self.lock. """
    def __init__(self, bus, busname, mainobj):
        BasePlugin.__init__(self, bus, busname, mainobj)
        self.lock    = Lock()

method = partial( dbus.service.method, settings.DBUS_IFACE_SYSTEMD )
signal = partial( dbus.service.signal, settings.DBUS_IFACE_SYSTEMD )

method.__doc__ = "Method decorator that has the DBus Interface pre-defined."
signal.__doc__ = "Signal decorator that has the DBus Interface pre-defined."


def make_deferredmethod(in_signature, once_first, once_last, meth):
    """ Defers the actual function call using job control. """
    import inspect
    args = inspect.getargspec(meth)[0]
    if "sender" not in args:
        raise KeyError("'%s' needs to take a 'sender' argument" % meth.__name__)

    if once_first and once_last:
        raise ValueError("'%s' has once_first and once_last set to True" % meth.__name__)

    # First let method() do its thing because it needs the original function.
    method(in_signature=in_signature, out_signature="", sender_keyword="sender")(meth)

    # Now we define a wrapper that checks if we are currently building a job
    # for the given sender. If so, the method call gets added to the job.
    # If not, the call is executed instantly.
    @wraps(meth)
    def wrapper(self, *args, **kwargs):
        sender = kwargs["sender"]
        # We have to get the main object, unless we are the main object ourselves.
        if hasattr(self, "mainobj"):
            obj = self.mainobj
        else:
            obj = self
        # If not building a job, call directly.
        if sender not in obj.jobs:
            return meth(self, *args, **kwargs)
        else:
            found = False
            if once_first or once_last:
                for call in obj.jobs[sender]:
                    if call[0] == meth:
                        if once_last:
                            obj.jobs[sender].remove(call)
                        found = True
                        break
            if once_last or not found:
                obj.jobs[sender].append((meth, self, args, kwargs))

    # Now copy everything the method() decorator added to meth over to the wrapper.
    wrapper.__dict__.update(meth.__dict__)

    return wrapper

def deferredmethod(in_signature, once_first=False, once_last=False):
    return partial( make_deferredmethod, in_signature, once_first, once_last )
