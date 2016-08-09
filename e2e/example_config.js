'use strict';
(function(){
  module.exports = {
    url     : '<url_of_your_machine>/openattic/#/login', // Set where to go to log in.
    username: '<log_in_name>', // Name of the user protractor uses.
    password: '<user_password>', // Password for the $log_in_name user.
    sleep   : 2000, // Default browser test sleep time.
    pools   : { // Contains all normal pool definitions
      // Please make sure that the first item in pools is a VG.
      vg: { // Defines a pool
        name        : '<volume_group_name>',
        size        : '<size>',
        unit        : 'GB',
        type        : 'vg', // Type of the pool. (Only in this case optional.)
        volumeTypes : [ // Supported volume types of a specific pool.
          'LUN',
          'XFS',
          'Btrfs',
          'ZFS',
          'ext4',
          'ext3',
          'ext2'
        ]
      },
      zfs: { // Defines a pool
        name        : '<zpool_name>',
        size        : '<size>',
        unit        : 'GB',
        type        : 'zpool', // Type of the pool.
        volumeTypes : [ // Supported volume types of a specific pool.
          'LUN',
          'ZFS'
        ]
      }
    },
    cephCluster: { // Contains all ceph cluster definitions
      cluster1: { // Defines a cluster
        name: '<cluster_name>', // The name of the ceph cluster.
        pools: { // Contains all pool definitions for this cluster
          cephPool1: { // Defines a pool
            name        : '<ceph_pool_name>',
            size        : '<size>',
            unit        : 'GB',
            writable    : '<isWritable>' // If $isWritable is false nothing will be created on the pool.
          },
          cephPool2: { // Defines a pool
            name        : '<ceph_pool_name>',
            size        : '<size>',
            unit        : 'GB',
            writable    : '<isWritable>' // If $isWritable is false nothing will be created on the pool.
          }
        }
      },
      cluster2: { // Defines a cluster
        name: '<cluster_name>', // The name of the ceph cluster.
        pools: { // Contains all pool definitions for this cluster
          cephPool1: { // Defines a pool
            name        : '<ceph_pool_name>',
            size        : '<size>',
            unit        : 'GB',
            writable    : '<isWritable>' // If $isWritable is false nothing will be created on the pool.
          },
          cephPool2: { // Defines a pool
            name        : '<ceph_pool_name>',
            size        : '<size>',
            unit        : 'GB',
            writable    : '<isWritable>' // If $isWritable is false nothing will be created on the pool.
          },
          cephPool3: { // Defines a pool
            name        : '<ceph_pool_name>',
            size        : '<size>',
            unit        : 'GB',
            writable    : '<isWritable>' // If $isWritable is false nothing will be created on the pool.
          }
        }
      }
    }
  };
}());
