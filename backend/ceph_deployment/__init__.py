try:
    import ceph
except ImportError:
    print 'Cannot import app "ceph", disabling app "ceph_deployment"'
    raise ImportError()
