import rados  # TODO add this to the dependecy of the ceph deb/rpm package.
import os


class Client(object):
    """Represents the connection to a single ceph cluster."""

    instance = None

    def __init__(self, cluster_name='ceph', conf_file=''):
        self._conf_file = conf_file if conf_file else os.path.join('/etc/ceph/', cluster_name + '.conf')
        self._pools = {}
        self._cluster = None
        self.connect(self._conf_file)

    def _get_pool(self, pool_name):
        if not pool_name in self._pools:
            self._pools[pool_name] = self._cluster.open_ioctx(pool_name)
        self._pools[pool_name].require_ioctx_open()

        return self._pools[pool_name]

    def connect(self, conf_file):
        if self._cluster is None:
            print('rados', rados)
            self._cluster = rados.Rados(conffile=conf_file)

        if not self.connected():
            self._cluster.connect()

        return self._cluster

    def __del__(self):
        for pool_name, pool in self._pools.items():
            pool.close()

        if self._cluster and self._cluster.state == 'connected':
            self._cluster.shutdown()

    # @classmethod
    # def get_instance(cls, cluster_name='ceph', conf_file=''):
    #     if cls.instance is None:
    #         cls.instance = cls(cluster_name=cluster_name, conf_file=conf_file)

    #     return cls.instance

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

    def pool_exist(self, name):
        return self._cluster.pool_exists()

    def delete_pool(self, pool_name):
        return self._cluster.delete_pool(pool_name)

    def get_stats(self, pool_name):
        return self._get_pool(pool_name).get_stats()

    def change_pool_owner(self, pool_name, auid):
        return self._get_pool(pool_name).change_auid(auid)

client = Client()
