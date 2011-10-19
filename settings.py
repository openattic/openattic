# -*- coding: utf-8 -*-
# kate: space-indent on; indent-width 4; replace-tabs on;

PROJECT_ROOT = None
PROJECT_URL  = '/openattic'
# das folgende wird gebraucht weil gunicorn SCRIPT_URL und PATH_INFO nicht setzt
# fyi: SCRIPT_URL=/filer/lvm/ PATH_INFO=/lvm/ würde klären
#FORCE_SCRIPT_NAME = "/filer"

from os.path import join, dirname, abspath, exists
if not PROJECT_ROOT or not exists( PROJECT_ROOT ):
    PROJECT_ROOT = dirname(abspath(__file__))

from ConfigParser import ConfigParser

DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    # ('Your Name', 'your_email@domain.com'),
)

LVM_CHOWN_GROUP="users"

MANAGERS = ADMINS

# Read database.ini
DATABASES = {}

conf = ConfigParser()
conf.read("/etc/openattic/database.ini")
for sec in conf.sections():
    DATABASES[sec] = {
        "ENGINE":   conf.get(sec, "engine"),
        "NAME":     conf.get(sec, "name"),
        "USER":     conf.get(sec, "user"),
        "PASSWORD": conf.get(sec, "password"),
        "HOST":     conf.get(sec, "host"),
        "PORT":     conf.get(sec, "port"),
    }

DBUS_IFACE_SYSTEMD = "org.openattic.systemd"

AUTH_PROFILE_MODULE = 'userprefs.UserProfile'

# Log execution of "lvs" and "vgs" commands.
# Those don't usually fail and are executed quite often (tm) to generate the LV and VG lists,
# so logging them might not make too much sense, but it's up to you. :)
# Logging commands like lvcreate/lvresize/lvremove won't be affected by this.
LVM_LOG_COMMANDS = False

# Auto-Configure distro defaults
import lsb_release
distro = lsb_release.get_distro_information()
if distro['ID'] == 'Debian' and distro['RELEASE'] >= "6.0":
    ISCSI_IETD_CONF     = "/etc/iet/ietd.conf"
    ISCSI_TARGETS_ALLOW = "/etc/iet/targets.allow"
    ISCSI_TARGETS_DENY  = "/etc/iet/targets.deny"
    ISCSI_INITR_ALLOW   = "/etc/iet/initiators.allow"
    ISCSI_INITR_DENY    = "/etc/iet/initiators.deny"
    SAMBA_INITSCRIPT    = "/etc/init.d/samba"
elif distro['ID'] == 'Ubuntu' and distro['RELEASE'] >= "10.04":
    ISCSI_IETD_CONF     = "/etc/ietd.conf"
    ISCSI_TARGETS_ALLOW = "/etc/targets.allow"
    ISCSI_TARGETS_DENY  = "/etc/targets.deny"
    ISCSI_INITR_ALLOW   = "/etc/initiators.allow"
    ISCSI_INITR_DENY    = "/etc/initiators.deny"
    SAMBA_INITSCRIPT    = "/etc/init.d/smbd"

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
MEDIA_URL = PROJECT_URL + '/static'

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
ADMIN_MEDIA_PREFIX = PROJECT_URL + '/media/'

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


PAM_AUTH_SERVICE = "itn_activedirectory"
AUTHENTICATION_BACKENDS = ( 'pam-auth.PamBackend', 'django.contrib.auth.backends.ModelBackend' )

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

TEMPLATE_CONTEXT_PROCESSORS = [
    "django.core.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    'processors.project_url',
]

ROOT_URLCONF = 'urls'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    join(PROJECT_ROOT, 'templates'),
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
    'django.contrib.markup',
    'userprefs',
    'cmdlog',
    'hoststats',
    'peering',
    'rpcd',
    'systemd',
    'sysutils',
]

def modprobe( name ):
    """ Try to import the named module, and if that works add it to INSTALLED_APPS. """
    try:
        __import__( name )
    except ImportError:
        pass
    else:
        INSTALLED_APPS.append( name )

import os
INSTALLED_MODULES = os.listdir( join( PROJECT_ROOT, "installed_apps.d") )
for name in INSTALLED_MODULES:
    modprobe(name)

modprobe('django_extensions')
modprobe('rosetta')
