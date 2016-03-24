import rados  # TODO add this to the dependecy of the ceph deb/rpm package.
import os


class Client(object):
    """Represents the connection to a single ceph cluster."""

    def __init__(self, cluster_name='ceph'):
        self._conf_file = os.path.join('/etc/ceph/', cluster_name + '.conf')
        self._keyring = os.path.join('/etc/ceph', cluster_name + '.client.admin.keyring')
        self._pools = {}
        self._cluster = None
        self.connect(self._conf_file)

    def _get_pool(self, pool_name):
        if pool_name not in self._pools:
            self._pools[pool_name] = self._cluster.open_ioctx(pool_name)
        self._pools[pool_name].require_ioctx_open()

        return self._pools[pool_name]

    def connect(self, conf_file):
        if self._cluster is None:
            self._cluster = rados.Rados(conffile=conf_file, conf={'keyring': self._keyring})

        if not self.connected():
            self._cluster.connect()

        return self._cluster

    def disconnect(self):
        for pool_name, pool in self._pools.items():
            if pool and pool.close:
                pool.close()

        if self.connected():
            self._cluster.shutdown()

    def connected(self):
        return self._cluster and self._cluster.state == 'connected'

    def get_cluster_stats(self):
        return self._cluster.get_cluster_stats()

    def get_fsid(self):
        return self._cluster.get_fsid()

    def list_pools(self):
        return self._cluster.list_pools()

    def create_pool(self, pool_name, auid=None, crush_rule=None):
        return self._cluster.create_pool(pool_name, auid=auid, crush_rule=crush_rule)

    def pool_exists(self, name):
        return self._cluster.pool_exists()

    def delete_pool(self, pool_name):
        return self._cluster.delete_pool(pool_name)

    def get_stats(self, pool_name):
        return self._get_pool(pool_name).get_stats()

    def change_pool_owner(self, pool_name, auid):
        return self._get_pool(pool_name).change_auid(auid)
