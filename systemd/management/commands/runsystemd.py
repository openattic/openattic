# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

"""
 *  Copyright (C) 2011-2014, it-novum GmbH <community@open-attic.org>
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
import os.path
import sys
import traceback
import logging
import socket
import signal

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

from systemd.plugins   import makeloggedfunc, deferredmethod
from systemd.lockutils import acquire_lock, release_lock, Lockfile

class SystemD(dbus.service.Object):
    """ Implements the main DBus section (/). """

    def __init__(self, detected_modules):
        self.bus = dbus.SystemBus()
        dbus.service.Object.__init__(self, self.bus, "/")
        self.busname = dbus.service.BusName(settings.DBUS_IFACE_SYSTEMD, self.bus)

        self.jobs = {}
        self.wantlocks = {}
        self.havelocks = {}
        self.procs = []

        self.detected_modules = detected_modules
        self.modules = {}
        for module in detected_modules:
            try:
                daemon = getattr( getattr( module, "systemapi" ), "SystemD" )
                self.modules[ module.__name__ ] = daemon(self.bus, self.busname, self)
            except:
                traceback.print_exc()

        signal.signal(signal.SIGCHLD, self._cleanup_procs)

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
    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="", sender_keyword="sender")
    def start_queue(self, sender):
        if sender not in self.jobs:
            self.jobs[sender] = []
        else:
            raise ValueError("there is already an open queue")

    def _run_queue(self, sender):
        # In case we're in a background process, make super-duper sure SIGCHLD is handled
        signal.signal(signal.SIGCHLD, self._cleanup_procs)
        logging.info( "[%d/%s] Incoming Queue Dump:", os.getpid(), sender )
        for func, scope, args, kwargs in self.jobs[sender]:
            logging.info( "[%d/%s] -> %s::%s(%s)", os.getpid(), sender, scope.dbus_path, func.__name__,
                ', '.join([repr(arg) for arg in args]))
        logging.info( "[%d/%s] End of queue dump.", os.getpid(), sender )
        try:
            if sender in self.wantlocks:
                self.havelocks[sender] = []
                with Lockfile("/var/lock/openattic/acquire_lock"):
                    for lockfile in self.wantlocks[sender]:
                        logging.info("[%d/%s] Acquiring lock '%s'..." % (os.getpid(), sender, lockfile))
                        self.havelocks[sender].append(acquire_lock(lockfile))
                        logging.info("[%d/%s] Acquired lock '%s'." % (os.getpid(), sender, lockfile))
            else:
                logging.info("[%d] No locks were requested for this queue." % os.getpid())

            for func, scope, args, kwargs in self.jobs[sender]:
                logging.info( "[%d/%s] Executing deferred call to %s::%s(%s)", os.getpid(), sender, scope.dbus_path, func.__name__,
                    ', '.join([repr(arg) for arg in args]))
                func(scope, *args, **kwargs)
        except:
            logging.error("Received error:\n" + traceback.format_exc())
        finally:
            self._release_acquired_locks(sender)
            if sender in self.wantlocks:
                del self.wantlocks[sender]

    @makeloggedfunc
    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="", sender_keyword="sender")
    def run_queue(self, sender):
        if sender not in self.jobs:
            return
        try:
            self._run_queue(sender)
        finally:
            del self.jobs[sender]

    @makeloggedfunc
    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="", sender_keyword="sender")
    def run_queue_background(self, sender):
        if sender not in self.jobs:
            return
        try:
            from django.db import close_connection
            from multiprocessing import Process
            # Close database connections prior to forking.
            # Otherwise, child processes might inherit our connection and close
            # it for us, which doesn't play well with this version of Django
            # not being able to properly deal with died connections.
            # This has been fixed in Django 1.5:
            #   https://code.djangoproject.com/ticket/15802
            # close_connection will go away in Django 1.6:
            #   https://code.djangoproject.com/ticket/17887
            close_connection()
            pp = Process(target=self._run_queue, args=(sender,))
            self.procs.append(pp)
            pp.start()
        finally:
            del self.jobs[sender]

    @makeloggedfunc
    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="", out_signature="", sender_keyword="sender")
    def discard_queue(self, sender):
        self._release_acquired_locks(sender)
        if sender in self.wantlocks:
            del self.wantlocks[sender]
        if sender in self.jobs:
            del self.jobs[sender]

    def _cleanup_procs(self, sig, frame):
        signal.signal(signal.SIGCHLD, self._cleanup_procs)
        deadprocs = []
        for proc in self.procs:
            try:
                if not proc.is_alive():
                    proc.join()
                    deadprocs.append(proc)
            except AssertionError:
                # Apparently, a process *ran* by one of our children terminated and
                # we got SIGCHLD for it for some reason.
                pass
        for proc in deadprocs:
            self.procs.remove(proc)

    @makeloggedfunc
    @dbus.service.method(settings.DBUS_IFACE_SYSTEMD, in_signature="s", out_signature="", sender_keyword="sender")
    def acquire_lock(self, lockfile, sender):
        if sender not in self.jobs:
            raise SystemError("Locks can only be acquired within transactions")
        if sender not in self.wantlocks:
            self.wantlocks[sender] = []
        if lockfile not in self.wantlocks[sender]:
            self.wantlocks[sender].append( lockfile )

    def _release_acquired_locks(self, sender):
        if sender not in self.havelocks:
            logging.info("[%d/%s] Releasing acquired locks: None acquired." % (os.getpid(), sender))
            return
        for lock in self.havelocks[sender]:
            logging.info("[%d/%s] Releasing acquired lock '%s'." % (os.getpid(), sender, lock[0]))
            release_lock(lock)
        del self.havelocks[sender]

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
    )

    def handle(self, **options):
        if os.getuid() != 0:
            raise SystemError( "I need to run as root." )

        gobject.threads_init()

        os.environ["LANG"] = "en_US.UTF-8"

        if 'logfile' in options and options['logfile']:
            sys.stdout.close()
            sys.stderr.close()
            sys.stdout = open(options['logfile'], "ab", buffering=False)
            sys.stderr = sys.stdout

        rootlogger = logging.getLogger()
        rootlogger.name = "openattic_systemd"
        rootlogger.setLevel(logging.DEBUG)

        logch = logging.StreamHandler()
        logch.setLevel({2: logging.DEBUG, 1: logging.INFO, 0: logging.WARNING}[int(options['verbosity'])])
        logch.setFormatter( logging.Formatter('%(asctime)s - %(levelname)s - %(message)s') )
        rootlogger.addHandler(logch)

        if 'sysloglevel' in options and options['sysloglevel'].upper() != 'OFF':
            try:
                logsh = SysLogHandler(address="/dev/log")
            except socket.error, err:
                logging.error("Failed to connect to syslog: " + unicode(err))
            else:
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
