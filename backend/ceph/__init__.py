from distutils.spawn import find_executable

if not find_executable('ceph'):
    print(
        'ERROR:ceph:Ceph executable couldn\'t be found. ' +
        'The `ceph` package provided by your distribution is probably not installed.')
    raise ImportError()

try:
    import rados
except ImportError:
    print('ERROR:ceph:`rados` library couldn\'t be found.')
    raise
