import os, sys

# Set this to the same path you used in settings.py, or None for auto-detection.
PROJECT_ROOT = None;

### DO NOT CHANGE ANYTHING BELOW THIS LINE ###

PROJECT_ROOT = None

from os.path import join, dirname, abspath, exists
if not PROJECT_ROOT or not exists( PROJECT_ROOT ):
    PROJECT_ROOT = dirname(abspath(__file__))

# environment variables
sys.path.insert( 0, PROJECT_ROOT )
os.environ['DJANGO_SETTINGS_MODULE'] = 'settings'


# If you get an error about Python not being able to write to the Python
# egg cache, the egg cache path might be set awkwardly. This should not
# happen under normal circumstances, but every now and then, it does.
# Uncomment this line to point the egg cache to /tmp.
#os.environ['PYTHON_EGG_CACHE'] = '/tmp/pyeggs'


# WSGI handler
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
