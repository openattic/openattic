/*
'use strict';

(function() {
  module.exports = {
    url     : '<openattic-url>/openattic/#/login',
    username: 'openattic',
    password: 'openattic',
    sleep   : 2000,
    pools   : {
// Please make sure that the first item in pools is a VG.
      vg: {
        name        : '<name>',
        size        : <size>,
        unit        : 'GB',
        volumeTypes : [ //What you can do with your pool
          'Create LUN',
          'Create Virtualization Store -> XFS',
          'Create File Store -> BTRFS'
        ]
      },
      vg2: {
        name        : '<name>',
        size        : <size>,
        unit        : 'GB',
        volumeTypes : [ //What you can do with your pool
          'Create LUN',
          'Create Virtualization Store -> XFS',
          'Create File Store -> BTRFS'
        ]
      }
    }
  };
}());
*/