// 'use strict';
// <--- this is an example config for e2e tests; enable and adapt this config to your oA setup in order to run e2e tests --->
// (function() {
//   module.exports = {
//     url     : 'http://<IP/hostname>/openattic/#/login',
//     username: 'openattic',
//     password: 'openattic',
//     sleep   : 2000,
// please make sure that the first item in pools is a VG
//     pools   : {
//       vg: {
//         name        : 'vg01',
//         size        : 15.00,
//         unit        : 'GB',
//         volumeTypes : [
//           'Create LUN',
//           'Create Virtualization Store -> XFS',
//           'Create File Store -> BTRFS'
//         ]
//       },
//       vg_1: {
//         name        : 'vg02',
//         size        : 10.00,
//         unit        : 'GB',
//         volumeTypes : [
//           'Create LUN',
//           'Create Virtualization Store -> XFS',
//           'Create File Store -> BTRFS'
//         ]
//       }
//     }
//   };
// }());
