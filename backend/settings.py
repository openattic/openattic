# -*- coding: utf-8 -*-

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
import logging
import sys

from configobj import ConfigObj
from utilities import set_globals_from_file, write_single_setting, read_single_setting
from rest_framework import ISO_8601

PROJECT_ROOT = None
PROJECT_URL = '/openattic'
# the following is needed in gunicorn, because it doesn't set SCRIPT_URL and PATH_INFO
# fyi: SCRIPT_URL=/filer/lvm/ PATH_INFO=/lvm/ would allow for Django to auto-detect the path
# FORCE_SCRIPT_NAME = PROJECT_URL

DATA_ROOT = "/var/lib/openattic"
import os

from os.path import join, dirname, abspath, exists, isfile

if not PROJECT_ROOT or not exists(PROJECT_ROOT):
    PROJECT_ROOT = dirname(abspath(__file__))

BASE_DIR = PROJECT_ROOT

# Try to find the GUI
if exists(join(PROJECT_ROOT, "..", "webui", "dist")):
    GUI_ROOT = join(PROJECT_ROOT, "..", "webui", "dist")
else:
    GUI_ROOT = "/usr/share/openattic-gui"

API_ROOT = "/openattic/api"
API_OS_USER = 'openattic'

DISABLE_CSRF_FOR_API_PATH = ['/api/grafana']

from ConfigParser import ConfigParser

DEBUG = True
TEMPLATE_DEBUG = DEBUG
ALLOWED_HOSTS = '*'  # Required by Django 1.8

APPEND_SLASH = False

LVM_CHOWN_GROUP = "users"

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'oa_auth.ExtendedBasicAuthentication',
        'oa_auth.CsrfExemptSessionAuthentication',  # Disables CSRF for paths in DISABLE_CSRF_FOR_API_PATH
        'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'rest_framework.filters.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'EXCEPTION_HANDLER': 'exception.custom_handler',
    'PAGINATE_BY': 50,  # Only DRF 2. Dropdown inputs don't handle pagination.
    'PAGINATE_BY_PARAM': 'pageSize',  # Only DRF 2
    'MAX_PAGINATE_BY': 100,  # Only DRF 2
    'DEFAULT_PAGINATION_CLASS': 'rest.pagination.PageSizePageNumberPagination',  # Only DRF 3
    'PAGE_SIZE': 50,  # Setting required by DRF 3. Set to 50 to prevent dropdown inputs from being
    # truncated, which don't handle pagination.
    'URL_FIELD_NAME': 'url',
    'DATETIME_FORMAT': ISO_8601
}


def read_database_configs(configfile):
    # Reads the database configuration of an INI file
    databases = {}

    if not os.access(configfile, os.R_OK):
        raise IOError('Unable to read {}'.format(configfile))

    conf = ConfigParser()
    conf.read(configfile)

    if not len(conf.sections()):
        raise IOError('{} does not contain expected content'.format(configfile))

    for sec in conf.sections():
        databases[sec] = {
            "ENGINE": conf.get(sec, "engine"),
            "NAME": conf.get(sec, "name"),
            "USER": conf.get(sec, "user"),
            "PASSWORD": conf.get(sec, "password"),
            "HOST": conf.get(sec, "host"),
            "PORT": conf.get(sec, "port"),
        }

    return databases


DATABASES = read_database_configs('/etc/openattic/database.ini')

DBUS_IFACE_SYSTEMD = "org.openattic.systemd"

AUTH_PROFILE_MODULE = 'userprefs.UserProfile'

# Auto-Configure distro defaults
try:
    import platform

    distro, version, codename = platform.linux_distribution()
except:
    pass
else:
    if distro in ('Red Hat Enterprise Linux Server', 'CentOS Linux'):
        SAMBA_SERVICE_NAME = "smb"
        LVM_HAVE_YES_OPTION = True
    elif distro == "Ubuntu" or distro == "debian":
        SAMBA_SERVICE_NAME = "smbd"

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# On Unix systems, a value of None will cause Django to use the same
# timezone as the operating system.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'Europe/Berlin'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-us'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# If you set this to False, Django will not format dates, numbers and
# calendars according to the current locale
USE_L10N = True

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = join(PROJECT_ROOT, 'htdocs')

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = PROJECT_URL + '/static/'

STATIC_URL = PROJECT_URL + '/staticfiles/'
STATIC_ROOT = "/var/lib/openattic/static"
STATICFILES_DIRS = (MEDIA_ROOT,)

LOGIN_URL = PROJECT_URL + '/accounts/login/'
LOGIN_REDIRECT_URL = PROJECT_URL + "/"

# Use cookies that expire as soon as the user closes their browser.
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# DeepSea settings.
DEEPSEA_MIN_VERSION_ISCSI = "0.8.0"

def read_secret_from_config():
    """
    Try to read from our config file. Then try to read from old .secret.txt file. Then
    generate a new secret.

    :return: tuple. First element is the secret, second element is a boolean telling if we should
     write the secret later on. We cannot write the secret here, because django is not yet fully
     functional.
    """
    try:
        secret = read_single_setting('DJANGO_SECRET')
        if secret:
            return secret, False
    except KeyError:
        pass

    # Pre 3.6.1: we have used a dedicated file to store the django secret.
    try:
        secret = open(join(PROJECT_ROOT, '.secret.txt')).read().strip()
        if secret:
            return secret, True
    except IOError:
        pass
    except Exception:
        logging.exception('failed')

    import string
    from django.utils.crypto import get_random_string

    secret = get_random_string(50, string.ascii_letters + string.digits +
                               string.punctuation)

    return secret, True


def write_secret_to_config(secret):
    import dbus
    try:
        write_single_setting('DJANGO_SECRET', secret, set_in_django_settings=False)
        secret_file_name = join(PROJECT_ROOT, '.secret.txt')
        try:
            os.remove(secret_file_name)
        except OSError as e:
            logging.info('failed to delete {}: {}'.format(secret_file_name, str(e)))

    except dbus.DBusException:
        logging.exception('Failed to write secret key. Ignoring')


SECRET_KEY, needs_to_write_secret_to_settings = read_secret_from_config()


def read_version():
    oa_dir = BASE_DIR

    if str.endswith(oa_dir, "/backend"):
        oa_dir = str.rsplit(oa_dir, "/", 1)[0]

    version_file = oa_dir + "/version.txt"
    assert isfile(version_file)
    return ConfigObj(version_file)


VERSION_CONF = read_version()


def log_prefix():
    pid = os.getpid()
    try:
        arg = (arg for arg in sys.argv if 'python' not in arg and 'manage.py' not in arg).next()
    except StopIteration:  # may happen, if you run a python repl manually.
        arg = sys.argv[0]
    return '{} {}'.format(pid, arg)


# Set logging
LOGGING_FILENAME = '/var/log/openattic/openattic.log'
LOG_LEVEL='INFO'

# In order to overwrite LOGGING_FILENAME, we have to read the settings here again.
# FIXME: find a better solution
set_globals_from_file(globals(), join(os.getcwd(), 'settings_local.conf'))

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'oa': {
            'format': '%(asctime)s {} %(levelname)s %(name)s#%(funcName)s - %(message)s'.format(
                log_prefix())
        }
    },
    'handlers': {
        'file': {
            'level': LOG_LEVEL,
            'class': 'logging.FileHandler',
            'filename': LOGGING_FILENAME,
            'formatter': 'oa',
        }
    },
    'loggers': {
        '': {
            'handlers': ['file'],
            'level': LOG_LEVEL,
            'propagate': False
        },
        # By default, the Requests library writes log messages to the console, along the lines of
        # "Starting new HTTP connection (1): example.com"
        'requests.packages.urllib3': {
            'handlers': ['file'],
            'level': logging.WARNING
        }
    }
}

# Read domain.ini.
__domconf__ = ConfigParser()

#   set defaults...
__domconf__.add_section("pam")
__domconf__.set("pam", "service", "openattic")
__domconf__.set("pam", "enabled", "no")
__domconf__.set("pam", "is_kerberos", "yes")

__domconf__.add_section("kerberos")
__domconf__.set("kerberos", "enabled", "no")

__domconf__.add_section("database")
__domconf__.set("database", "enabled", "yes")

__domconf__.add_section("authz")
__domconf__.set("authz", "group", "")

#   now read the actual config, if it exists. If it doesn't, the defaults are fine,
#   so we don't need to care about whether or not this works.
__domconf__.read("/etc/openattic/domain.ini")

# A PAM authentication service to query with our user data.
# If this does not succeed, openATTIC will fall back to its
# internal database.
PAM_AUTH_SERVICE = __domconf__.get("pam", "service")
# Whether or not the service given in PAM_AUTH_SERVICE uses
# Kerberos as its backend, therefore requiring user names
# to be all UPPERCASE.
PAM_AUTH_KERBEROS = __domconf__.getboolean("pam", "is_kerberos")

AUTHENTICATION_BACKENDS = []
if __domconf__.getboolean("pam", "enabled"):
    AUTHENTICATION_BACKENDS.append("pamauth.PamBackend")
if __domconf__.getboolean("kerberos", "enabled"):
    AUTHENTICATION_BACKENDS.append('django.contrib.auth.backends.RemoteUserBackend')
if __domconf__.getboolean("database", "enabled"):
    AUTHENTICATION_BACKENDS.append('django.contrib.auth.backends.ModelBackend')

# Group used for authorization. (If a user is in this group, they get superuser
# privileges when they login, if they don't have them already.)
AUTHZ_SYSGROUP = __domconf__.get("authz", "group").decode("utf-8")

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
)

TEMPLATE_CONTEXT_PROCESSORS = [
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    'processors.project_url',
    'processors.profile',
]

ROOT_URLCONF = 'urls'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    '/etc/openattic/templates',
    '/usr/local/share/openattic/templates',
    join(PROJECT_ROOT, 'templates'),
)

LOCALE_PATHS = (
    '/etc/openattic/locale',
    '/usr/local/share/openattic/locale',
    join(PROJECT_ROOT, 'locale'),
)

MPLCONFIGDIR = "/tmp/.matplotlib"

# Add or replace additional configuration variables
for settings_file in ('/etc/default/openattic', '/etc/sysconfig/openattic'):
    set_globals_from_file(globals(), settings_file)

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.messages',
    'django.contrib.admin',
    'django.contrib.admindocs',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'ifconfig',
    'userprefs',
    'cmdlog',
    'rest',
    'systemd',
    'sysutils',
    'volumes',
]

INSTALLED_MODULES = []


def __loadmods__():
    def modprobe(modname):
        """ Try to import the named module, and if that works add it to INSTALLED_APPS. """
        try:
            __import__(modname)
        except ImportError:
            pass
        else:
            INSTALLED_MODULES.append(modname)
            if modname not in INSTALLED_APPS:
                INSTALLED_APPS.append(modname)

    import re
    rgx = re.compile("^(?P<idx>\d\d)_(?P<name>\w+)$")

    def modnamecmp(a, b):
        amatch = rgx.match(a)
        bmatch = rgx.match(b)
        if amatch:
            if bmatch:
                res = cmp(int(amatch.group("idx")), int(bmatch.group("idx")))
                if res != 0:
                    return res
                else:
                    return cmp(amatch.group("name"), bmatch.group("name"))
            else:
                return -1
        else:
            if bmatch:
                return 1
            else:
                return cmp(a, b)

    mods = [dir for dir in os.listdir(join(PROJECT_ROOT, "installed_apps.d")) if
            not dir.startswith('.')]
    mods.sort(cmp=modnamecmp)
    for name in mods:
        m = rgx.match(name)
        if m:
            modprobe(m.group("name"))
        else:
            modprobe(name)

    modprobe('django_extensions')
    modprobe('rosetta')
    modprobe('oa_settings')
    modprobe('oa_logging')
    modprobe('ifconfig')
    modprobe('rest')


__loadmods__()


# Load OA module settings
import oa_settings
oa_settings.load_settings()

# This enables developers and test systems to override settings in a non-versioned file.
set_globals_from_file(globals(), join(os.getcwd(), 'settings_local.conf'))

if needs_to_write_secret_to_settings:
    write_secret_to_config(SECRET_KEY)
