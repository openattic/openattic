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

import os
import traceback
import logging

from logging.handlers import SysLogHandler
from threading import Lock
from optparse import make_option

import gobject
import dbus
import dbus.service
import dbus.types
import dbus.mainloop.glib

from django.core.management.base import BaseCommand
from django.conf import settings

from systemd.helpers   import makeloggedfunc
from systemd.procutils import create_job

class SystemD(dbus.service.Object):
    """ Implements the main DBus section (/). """

    def __init__(self, detected_modules):
        self.bus = dbus.SystemBus()
        dbus.service.Object.__init__(self, self.bus, "/")
        self.busname = dbus.service.BusName(settings.DBUS_IFACE_SYSTEMD, self.bus)

        self.job_lock = Lock()
        self.job_id = 0
        self.jobs = {}

        self.detected_modules = detected_modules
        self.modules = {}
        for module in detected_modules:
            try:
                daemon = getattr( getattr( module, "systemapi" ), "SystemD" )
                self.modules[ module.__name__ ] = daemon(self.bus, self.busname, self)
            except:
                traceback.print_exc()

    @makeloggedfunc
    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="as")
    def get_detected_modules(self):
        """ Return a list of detected submodules, no matter if loaded or not. """
        return [module.__name__ for module in self.detected_modules]

    @makeloggedfunc
    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="as")
    def get_loaded_modules(self):
        """ Return a list of actually loaded submodules. """
        return self.modules.keys()

    @makeloggedfunc
    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="s")
    def ping(self):
        """ Return 'pong' for connectivity tests. """
        return "pong"

    @makeloggedfunc
    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="i")
    def build_job(self):
        """ Create a new empty job queue and return its `jid`.

            Jobs can be enqueued using the `job_add_command` method and executed
            using the `enqueue_job` method. The job queue will then run each command
            sequentially in the background. Once finished, the `job_finished` event
            will be fired.
        """
        self.job_lock.acquire()
        self.job_id += 1
        jid = self.job_id
        self.jobs[jid] = []
        self.job_lock.release()
        return jid

    def _job_add_command(self, jid, cmd):
        self.job_lock.acquire()
        self.jobs[jid].append(cmd)
        self.job_lock.release()

    @makeloggedfunc
    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="is", out_signature="")
    def job_add_command(self, jid, cmd):
        """ Add a job to the job queue given by `jid`. """
        self._job_add_command(jid, cmd)

    @makeloggedfunc
    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="i", out_signature="")
    def enqueue_job(self, jid):
        """ Start execution of the job queue given by `jid`, if any commands have been added to it. """
        self.job_lock.acquire()
        if self.jobs[jid]:
            create_job( self.jobs[jid], self.job_finished, (jid,) )
        else:
            del self.jobs[jid]
        self.job_lock.release()

    @makeloggedfunc
    @dbus.service.signal(settings.DBUS_IFACE_SYSTEMD, signature="i")
    def job_finished(self, jid):
        """ Event fired whenever a job has completed. """
        self.job_lock.acquire()
        del self.jobs[jid]
        self.job_lock.release()



def getloglevel(levelstr):
    numeric_level = getattr(logging, levelstr.upper(), None)
    if not isinstance(numeric_level, int):
        raise ValueError('Invalid log level: %s' % levelstr)
    return numeric_level


class Command( BaseCommand ):
    help = "Daemon that executes all commands for which root is needed."
    option_list = BaseCommand.option_list + (
        make_option( "-l", "--logfile",
            help="Log to a logfile.",
            default=None
            ),
        make_option( "-L", "--loglevel",
            help="loglevel of said logfile, defaults to INFO.",
            default="INFO"
            ),
        make_option( "-s", "--sysloglevel",
            help="loglevel with which to log to syslog, defaults to WARNING. OFF disables syslog altogether.",
            default="WARNING"
            ),
        make_option( "-q", "--quiet",
            help="Don't log to stdout.",
            default=False, action="store_true"
            ),
    )

    def handle(self, **options):
        if os.getuid() != 0:
            raise SystemError( "I need to run as root." )

        gobject.threads_init()

        os.environ["LANG"] = "en_US.UTF-8"

        rootlogger = logging.getLogger()
        rootlogger.name = "openattic_systemd"
        rootlogger.setLevel(logging.DEBUG)

        if not options['quiet']:
            logch = logging.StreamHandler()
            logch.setLevel({2: logging.DEBUG, 1: logging.INFO, 0: logging.WARNING}[int(options['verbosity'])])
            logch.setFormatter( logging.Formatter('%(asctime)s - %(levelname)s - %(message)s') )
            rootlogger.addHandler(logch)

        if 'logfile' in options and options['logfile']:
            logfh = logging.FileHandler(options['logfile'])
            logfh.setLevel( getloglevel(options['loglevel']) )
            logfh.setFormatter( logging.Formatter('%(asctime)s - %(levelname)s - %(message)s') )
            rootlogger.addHandler(logfh)

        if 'sysloglevel' in options and options['sysloglevel'].upper() != 'OFF':
            logsh = SysLogHandler(address="/dev/log")
            logsh.setLevel( getloglevel(options['sysloglevel']) )
            logsh.setFormatter( logging.Formatter('%(name)s: %(levelname)s %(message)s') )
            rootlogger.addHandler(logsh)

        logging.info("Detecting modules...")
        sysdplugins = []
        for app in settings.INSTALLED_APPS:
            try:
                module = __import__( app+".systemapi" )
            except ImportError, err:
                if unicode(err) != "No module named systemapi":
                    logging.error("Got error when checking app %s: %s", app, unicode(err))
            else:
                sysdplugins.append(module)
        logging.info( "Loaded modules: %s", ', '.join([module.__name__ for module in sysdplugins]) )

        logging.info( "Running." )
        dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
        loop = gobject.MainLoop()
        master = SystemD(sysdplugins)
        loop.run()
