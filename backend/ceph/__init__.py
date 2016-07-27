import os

def has_executable(name):
    """Look in PATH if there's a file `ceph` which is callable."""
    for path in os.environ['PATH'].split(':'):
        file_path = os.path.join(path, name)
        if os.access(file_path, os.X_OK) and os.path.isfile(file_path):
            return True

    return False

def has_librados():
    try:
        import rados
    except ImportError:
        return False
    else:
        return True


if not has_executable('ceph'):
    print(
        'ERROR:ceph:Ceph executable couldn\'t be found. ' +
        'The `ceph` package provided by your distribution is probably not installed.')
    raise ImportError()

if not has_librados():
    print('ERROR:ceph:`rados` library couldn\'t be found.')
    raise ImportError()
