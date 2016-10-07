import os

try:
    import ceph
except ImportError:
    print 'Cannot import app "ceph", disabling app "ceph_deployment"'
    raise ImportError()

def has_executable(name):
    """Look in PATH if there's a file `ceph` which is callable."""
    for path in os.environ['PATH'].split(':'):
        file_path = os.path.join(path, name)
        if os.access(file_path, os.X_OK) and os.path.isfile(file_path):
            return True

    return False

if not has_executable('salt'):
    print '"salt" executable not found, disabling app "ceph_deployment"'
    raise ImportError()
