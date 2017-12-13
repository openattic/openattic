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
import sys
import atexit
import configobj

import pyinotify
from oa_settings import settings
from systemd import get_dbus_object


logger = logging.getLogger(__name__)


class Settings(object):
    """
    This class will be used to access the settings values that are declared in settings.py
    For instance if there is a setting declared in settings.py as:
      CUSTOM_SETTING = ("some_value", str)
    Then to access the value of this setting, one can just do:
      Settings.CUSTOM_SETTING
    """
    pass

    @staticmethod
    def keys():
        """
        Returns a list containing all the keys.
        :rtype: list
        """
        keys = [key for key in dir(Settings) if
                not callable(getattr(Settings, key)) and
                not key.startswith('_')]
        return keys

    @staticmethod
    def dict():
        """
        Returns a dictionary containing all the key/value pairs.
        :rtype: dict
        """
        result = {}
        for key in Settings.keys():
            result[key] = getattr(Settings, key)
        return result

    @staticmethod
    def has_values(prefix):
        """
        Checks if all settings starting with `prefix` evaluate to `True`. Returns `False` if at
        least one setting does not evaluate to `True`. Returns `False` if not settings could be
        found.

        :type prefix: str
        :rtype: bool
        """
        settings = [value for key, value in Settings.dict().items() if
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


def get_containing_folder_follow_links(file_path):
    if os.path.islink(file_path):
        file_path = os.readlink(file_path)
    ret = os.path.dirname(file_path)

    return ret


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
        logger.debug("Settings file %s was modified, trigger settings reload.", event.pathname)
        load_settings()

notifier = pyinotify.ThreadedNotifier(wm, SettingsFileHandler())
notifier.setDaemon(True)
notifier.start()
wm.add_watch(get_containing_folder_follow_links(settings_file), mask)


@atexit.register
def shutdown_inotify():
    notifier.stop()


def shutdown_inotify_signal(*args):
    """
    By calling `sys.exit(0)` the `@atexit` decorator of the `shutdown_inotify()` function is being
    used and the file descriptors are properly freed. If `sys.exit(0)` isn't called, the shutdown is
    performed in a way which doesn't call the `shutdown_inotify()` function.
    """
    sys.exit(0)

if sys.argv[0] != 'mod_wsgi':
    # mod_wsgi disables signals by default to not interfere with Apaches' signals, preventing issues
    # with actions such as restart or shutdown. Using signals with mod_wsgi is not recommended. By
    # excluding `mod_wsgi` these signals are only used for non WSGI processes like the openATTIC
    # systemd.
    signal.signal(signal.SIGINT, shutdown_inotify_signal)
    signal.signal(signal.SIGTERM, shutdown_inotify_signal)
    signal.signal(signal.SIGQUIT, shutdown_inotify_signal)


def _set_setting(key, val):
    if key not in settings_list:
        return
    setting_type = setting_init_dict[key][1]
    try:
        tval = setting_type(val)
        setattr(Settings, key, tval)
    except ValueError:
        logger.error("Invalid setting value for '%s': '%s' is not of type '%s'",
                     key, val, setting_type.__name__)
        print("Invalid setting value for '{}': '{}' is not of type '{}'"
              .format(key, val, setting_type.__name__))


def load_settings():
    for setting_key, (def_value, _) in setting_init_dict.items():
        setattr(Settings, setting_key, def_value)

    # Override settings from custom settings file
    for key, val in configobj.ConfigObj(settings_file).items():
        _set_setting(key, val)

    # Override settings from local settings file. This enables developers and test
    # systems to override settings in a non-versioned file.
    local_settings_file = os.path.join(os.getcwd(), 'settings_local.conf')
    if os.access(local_settings_file, os.R_OK):
        logger.debug("Reading local settings %s", local_settings_file)
        for key, val in configobj.ConfigObj(local_settings_file).items():
            _set_setting(key, val)

    _notify_settings_listeners()


def save_settings():
    def get_default(key):
        return setting_init_dict[key][0]

    def get_type(key):
        return setting_init_dict[key][1]

    def get_value(key):
        return getattr(Settings, key)

    save_settings_generic(settings_list, get_default, get_type, get_value)


def save_settings_generic(this_settings_list, get_default, get_type, get_value):
    conf_content = ""
    write_log = set()
    with open(settings_file, "r") as f:
        for line in f:
            sline = line.strip()
            idx = sline.find('=')
            if idx != -1 and not sline.startswith('#'):
                key = sline[:idx].strip()
                if key in this_settings_list:
                    if get_value(key) == get_default(key):
                        continue
                    if get_type(key) == int:
                        val_str = "{}".format(get_value(key))
                    else:
                        val_str = '"{}"'.format(get_value(key))
                    conf_content += '{}={}\n'.format(key, val_str)
                    write_log.add(key)
                    continue

            conf_content += line

    for key in this_settings_list:
        val = get_value(key)
        if key not in write_log and val != get_default(key):
            if get_type(key) == int:
                val_str = "{}".format(val)
            else:
                val_str = '"{}"'.format(val)
            conf_content += '{}={}\n'.format(key, val_str)

    logger.debug("Writing %s contents:\n%s", settings_file, conf_content)

    # try without dbus, if we have write access
    try:
        with open(settings_file, "w") as f:
            f.write(conf_content)
    except IOError:
        settings_dbus = get_dbus_object("/oa_settings")
        ret = settings_dbus.write_openattic_config(settings_file, conf_content)
        if ret == 0:
            return

        logger.error("Error while writing settings: errno=%s", ret)
        if ret == 13:
            raise Exception("Permission denied while writing settings to {}.\n"
                            "Please check file permissions for user \"openattic\""
                            .format(settings_file))
        else:
            raise Exception("Error while writing settings to {}: IOError errno={}"
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

    def settings_changed_handler(self):
        raise NotImplementedError('settings_changed_handler')
