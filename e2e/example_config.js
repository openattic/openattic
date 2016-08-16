/*
'use strict';

(function(){
  module.exports ={
    url     : '<openattic-url>/openattic/#/login',
    username: 'openattic',
    password: 'openattic',
    sleep   : 2000,
    outDir: '<existing_path>', // Path in which the errors can be stored in as screenshot and error log pair.
    pools   :{
    //Please make sure that the first item in pools is a VG.
      vg:{
        name        : '<name>',
        size        : <size>,
        unit        : 'GB',
        volumeTypes : [ //supported volume types of a specific pool
          'LUN',
          'XFS',
          'Btrfs',
          'ZFS',
          'ext4',
          'ext3',
          'ext2'
        ]
      },
      vg2:{
        name        : '<name>',
        size        : <size>,
        unit        : 'GB',
        volumeTypes : [ //supported volume types of a specific pool
          'LUN',
          'XFS',
          'Btrfs',
          'ZFS',
          'ext4',
          'ext3',
          'ext2'
        ]
      }
    }
  };
}());
*/