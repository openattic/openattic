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

PROJECT_ROOT = None
PROJECT_URL  = '/openattic'
# the following is needed in gunicorn, because it doesn't set SCRIPT_URL and PATH_INFO
# fyi: SCRIPT_URL=/filer/lvm/ PATH_INFO=/lvm/ would allow for Django to auto-detect the path
#FORCE_SCRIPT_NAME = PROJECT_URL

DATA_ROOT = "/var/lib/openattic"

from os.path import join, dirname, abspath, exists
if not PROJECT_ROOT or not exists( PROJECT_ROOT ):
    PROJECT_ROOT = dirname(abspath(__file__))

from ConfigParser import ConfigParser

DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    # ('Your Name', 'your_email@domain.com'),
)

APPEND_SLASH = False

LVM_CHOWN_GROUP = "users"

MANAGERS = ADMINS

ANGULAR_LOGIN = True

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'oa_auth.ExtendedBasicAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'rest_framework.filters.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'PAGINATE_BY':        50,
    'PAGINATE_BY_PARAM': 'page_size',
    'MAX_PAGINATE_BY':   100,
    'URL_FIELD_NAME':    'url',
}

# Read database.ini
DATABASES = {}

__conf__ = ConfigParser()
__conf__.read("/etc/openattic/database.ini")
for sec in __conf__.sections():
    DATABASES[sec] = {
        "ENGINE":   __conf__.get(sec, "engine"),
        "NAME":     __conf__.get(sec, "name"),
        "USER":     __conf__.get(sec, "user"),
        "PASSWORD": __conf__.get(sec, "password"),
        "HOST":     __conf__.get(sec, "host"),
        "PORT":     __conf__.get(sec, "port"),
    }

DBUS_IFACE_SYSTEMD = "org.openattic.systemd"

AUTH_PROFILE_MODULE = 'userprefs.UserProfile'

CACHES = {
    'systemd': {
        'BACKEND': 'django.core.cache.backends.memcached.MemcachedCache',
        'LOCATION': '127.0.0.1:11211',
    },
    'status': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'status_cache',
    },
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Log execution of "lvs" and "vgs" commands.
# Those don't usually fail and are executed quite often (tm) to generate the LV and VG lists,
# so logging them might not make too much sense, but it's up to you. :)
# Logging commands like lvcreate/lvresize/lvremove won't be affected by this.
LVM_LOG_COMMANDS = False

# If available, try to use Systemd to restart daemons.
USE_SYSTEMD_IF_AVAIL = True

# Auto-Configure distro defaults
try:
    import platform
    distro, version, codename = platform.linux_distribution()
except:
    pass
else:
    if distro in ('Red Hat Enterprise Linux Server', 'CentOS Linux'):
        NAGIOS_CFG_PATH = "/etc/nagios/nagios.cfg"
        NAGIOS_CONTACTS_CFG_PATH = "/etc/nagios/conf.d/openattic_contacts.cfg"
        NAGIOS_SERVICES_CFG_PATH = "/etc/nagios/conf.d/openattic.cfg"
        NAGIOS_RRD_BASEDIR = "/var/lib/pnp4nagios"
        NAGIOS_RRD_PATH = "/var/lib/pnp4nagios/%(host)s/%(serv)s.rrd"
        NAGIOS_XML_PATH = "/var/lib/pnp4nagios/%(host)s/%(serv)s.xml"
        NAGIOS_BINARY_NAME = "nagios"
        NAGIOS_SERVICE_NAME = "nagios"
        NAGIOS_STATUS_DAT_PATH = "/var/log/nagios/status.dat"
        SAMBA_SERVICE_NAME = "smb"
        LVM_HAVE_YES_OPTION = True
    elif distro == "Ubuntu":
        SAMBA_SERVICE_NAME = "smbd"
        USE_SYSTEMD_IF_AVAIL = False # Ubuntu ships with broken systemd. *sigh*

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

STATIC_URL  = PROJECT_URL + '/staticfiles/'
STATIC_ROOT = "/var/lib/openattic/static"
STATICFILES_DIRS = (MEDIA_ROOT,)

import django
if django.VERSION[:2] == (1, 2):
    # URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
    # trailing slash.
    # Examples: "http://foo.com/media/", "/media/".
    ADMIN_MEDIA_PREFIX = PROJECT_URL + '/static/admin/'

LOGIN_URL = PROJECT_URL + '/accounts/login/'
LOGIN_REDIRECT_URL = PROJECT_URL + "/"

# Automatically generate a .secret.txt file containing the SECRET_KEY.
# Shamelessly stolen from ByteFlow: <http://www.byteflow.su>
try:
    SECRET_KEY
except NameError:
    SECRET_FILE = join(PROJECT_ROOT, '.secret.txt')
    try:
        SECRET_KEY = open(SECRET_FILE).read().strip()
    except IOError:
        try:
            from random import choice
            SECRET_KEY = ''.join([choice('abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)') for i in range(50)])
            secret = file(SECRET_FILE, 'w')
            secret.write(SECRET_KEY)
            secret.close()
        except IOError:
            Exception('Please create a %s file with random characters to generate your secret key!' % SECRET_FILE)


# Read domain.ini.
__domconf__ = ConfigParser()

#   set defaults...
__domconf__.add_section("domain")
__domconf__.set("domain", "realm", "")
__domconf__.set("domain", "workgroup", "")

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

HAVE_KERBEROS = __domconf__.getboolean("kerberos", "enabled")

if __domconf__.get("domain", "realm"):
    SAMBA_DOMAIN = __domconf__.get("domain", "realm")
if __domconf__.get("domain", "workgroup"):
    SAMBA_WORKGROUP = __domconf__.get("domain", "workgroup")

# Group used for authorization. (If a user is in this group, they get superuser
# privileges when they login, if they don't have them already.)
AUTHZ_SYSGROUP = __domconf__.get("authz", "group").decode("utf-8")


# Timeout to use when connecting to peers via XMLRPC. This timeout only applies for
# the connect() and send() operations, but not for recv(); hence it can be set to an
# aggressively low value in order to either be sure we will get an answer or move on.
PEER_CONNECT_TIMEOUT=0.5

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
#     'django.template.loaders.eggs.Loader',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
)

from django import VERSION as django_version

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
    'ifconfig',
    'userprefs',
    'cmdlog',
    'peering',
    'rpcd',
    'rest',
    'systemd',
    'sysutils',
]

INSTALLED_MODULES = []

def __loadmods__():
    def modprobe( modname ):
        """ Try to import the named module, and if that works add it to INSTALLED_APPS. """
        try:
            __import__( modname )
        except ImportError:
            pass
        else:
            INSTALLED_MODULES.append( modname )
            INSTALLED_APPS.append( modname )

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

    import os
    mods = os.listdir( join( PROJECT_ROOT, "installed_apps.d") )
    mods.sort(cmp=modnamecmp)
    for name in mods:
        m = rgx.match(name)
        if m:
            modprobe(m.group("name"))
        else:
            modprobe(name)

    modprobe('django_extensions')
    modprobe('rosetta')

__loadmods__()
