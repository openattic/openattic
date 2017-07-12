# -*- coding: utf-8 -*-
"""
 *   Copyright (c) 2017 SUSE LLC
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
import inspect
import logging
import os
import signal
import atexit
import configobj

import pyinotify
from oa_settings import settings
from systemd import get_dbus_object


logger = logging.getLogger(__name__)


class Settings(object):
    '''
    This class will be used to access the settings values that are declared in settings.py
    For instance if there is a setting declared in settings.py as:
      CUSTOM_SETTING = ("some_value", str)
    Then to access the value of this setting, one can just do:
      Settings.CUSTOM_SETTING
    '''
    pass

    @staticmethod
    def has_values(prefix):
        """
        Checks if all settings starting with `prefix` evaluate to `True`. Returns `False` if at
        least one setting does not evaluate to `True`. Returns `False` if not settings could be
        found.

        :type prefix: str
        :rtype: bool
        """
        settings = [value for key, value in Settings.__dict__.items() if
                    key.startswith(prefix)]

        if len(settings) == 0:
            return False

        return all(settings)


_custom_settings = ('/etc/default/openattic', '/etc/sysconfig/openattic')
settings_file = None
for fn in _custom_settings:
    if os.access(fn, os.R_OK):
        settings_file = fn
        break
assert settings_file


settings_list = [i for i in dir(settings) if not inspect.ismethod(i) and not i.startswith('_')]

# populate Settings class
setting_init_dict = {}
for setting in settings_list:
    setting_init = getattr(settings, setting)
    setting_init_dict[setting] = setting_init
    setattr(Settings, setting, setting_init[0])


wm = pyinotify.WatchManager()
mask = pyinotify.IN_MODIFY


class SettingsFileHandler(pyinotify.ProcessEvent):
    def process_IN_MODIFY(self, event):
        if event.pathname == settings_file:
            logger.debug("Settings file %s was modified, trigger settings reload.", settings_file)
            load_settings()

notifier = pyinotify.ThreadedNotifier(wm, SettingsFileHandler())
notifier.setDaemon(True)
notifier.start()
wdd = wm.add_watch(settings_file[:settings_file.rfind('/')], mask)


@atexit.register
def shutdown_inotify(*args):
    wm.rm_watch(wdd.values())
    notifier.stop()

signal.signal(signal.SIGINT, shutdown_inotify)
signal.signal(signal.SIGTERM, shutdown_inotify)
signal.signal(signal.SIGQUIT, shutdown_inotify)


def load_settings():
    for setting_key, (def_value, _) in setting_init_dict.items():
        setattr(Settings, setting_key, def_value)

    # override settings from custom settings file
    for key, val in configobj.ConfigObj(settings_file).items():
        if key not in settings_list:
            continue
        setting_type = setting_init_dict[key][1]
        try:
            tval = setting_type(val)
            setattr(Settings, key, tval)
        except ValueError:
            logger.error("Invalid setting value for '%s': '%s' is not of type '%s'",
                         key, val, setting_type.__name__)
            print("Invalid setting value for '{}': '{}' is not of type '{}'"
                  .format(key, val, setting_type.__name__))

    _notify_settings_listeners()


def save_settings():
    conf_content = ""
    write_log = set()
    with open(settings_file, "r") as f:
        for line in f:
            sline = line.strip()
            idx = sline.find('=')
            if idx != -1:
                key = sline[:idx].strip()
                if key.startswith('#'):
                    key = key[1:]
                if key in settings_list:
                    if getattr(Settings, key) == setting_init_dict[key][0]:
                        continue
                    if setting_init_dict[key][1] == int:
                        val_str = "{}".format(getattr(Settings, key))
                    else:
                        val_str = '"{}"'.format(getattr(Settings, key))
                    conf_content += '{}={}\n'.format(key, val_str)
                    write_log.add(key)
                    continue

            conf_content += line

    for key in settings_list:
        val = getattr(Settings, key)
        if key not in write_log and val != setting_init_dict[key][0]:
            if setting_init_dict[key][1] == int:
                val_str = "{}".format(val)
            else:
                val_str = '"{}"'.format(val)
            conf_content += '{}={}\n'.format(key, val_str)

    logger.debug("Writing %s contents:\n%s", settings_file, conf_content)

    settings_dbus = get_dbus_object("/oa_settings")
    ret = settings_dbus.write_openattic_config(settings_file, conf_content)
    if ret == 0:
        return

    logger.error("Error while writing settings: errno=%s", ret)
    if ret == 13:
        raise Exception("Permission denied while writting settings to {}.\n"
                        "Please check file permissions for user \"openattic\""
                        .format(settings_file))
    else:
        raise Exception("Error while writting settings to {}: IOError errno={}"
                        .format(settings_file, ret))


# Settings listener implementation
_settings_listeners = []


def register_listener(listener):
    _settings_listeners.append(listener)


def _notify_settings_listeners():
    for listener in _settings_listeners:
        if inspect.isfunction(listener):
            listener()
        else:
            if hasattr(listener, 'settings_changed_handler') and \
               inspect.ismethod(getattr(listener, 'settings_changed_handler')):
                listener.settings_changed_handler()


class SettingsListener(object):
    def __init__(self):
        super(SettingsListener, self).__init__()
        register_listener(self)
