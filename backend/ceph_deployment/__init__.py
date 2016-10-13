from distutils.spawn import find_executable

try:
    import ceph
except ImportError:
    print 'Cannot import app "ceph", disabling app "ceph_deployment"'
    raise ImportError()

if not find_executable('salt'):
    print '"salt" executable not found, disabling app "ceph_deployment"'
    raise ImportError()
