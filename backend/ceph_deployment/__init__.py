import sys
from distutils.spawn import find_executable

try:
    import ceph
except ImportError:
    print >>sys.stderr, 'Cannot import app "ceph", disabling app "ceph_deployment"'
    raise ImportError()

if not find_executable('salt'):
    print >>sys.stderr, '"salt" executable not found, disabling app "ceph_deployment"'
    raise ImportError()
