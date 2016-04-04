import os


def has_executable(name):
    """Look in PATH if there's a file `ceph` which is callable."""
    for path in os.environ['PATH'].split(':'):
        if os.access(os.path.join(path, name), os.R_OK):
            return True

    return False


def has_ceph_config_file():
    conf_dir = '/etc/ceph'
    # Check for existance of /etc/ceph.
    if os.path.isdir(conf_dir):
        # Look into that directory and check if at least one conf file exists and is readable.
        for file_name in os.listdir(conf_dir):
            file_path = os.path.join(conf_dir, file_name)
            if file_name.endswith('.conf') and os.access(file_path, os.R_OK):
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

if not has_ceph_config_file():
    print('ERROR:ceph:Ceph configuration file couldn\'t be found.')
    raise ImportError()

if not has_librados():
    print('ERROR:ceph:`rados` library couldn\'t be found.')
    raise ImportError()
