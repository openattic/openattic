/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * This package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
exports.config = {

  seleniumAddress: 'http://localhost:4444/wd/hub',
  jasmineNodeOpts: {
    defaultTimeoutInterval: 360000,
  },
  framework: 'jasmine2',

  suites: {
   general              : '../e2e/general/**/*.e2e.js',
   disks                : '../e2e/disks/**/*.e2e.js',
   pools                : '../e2e/pools/**/*e2e.js',
   volumes              : '../e2e/volumes/volumes.e2e.js',
   volumes_add          : '../e2e/volumes/add/volumes_add.e2e.js',
   volumes_protection   : '../e2e/volumes/protection/**/*.e2e.js',
   volumes_resize       : '../e2e/volumes/resize/**/*.e2e.js',
   volumes_multiple     : '../e2e/volumes/multiple/**/*.e2e.js',
   snapshot             : '../e2e/snapshots/add/**/*.e2e.js',
   snapshot_clone       : '../e2e/snapshots/clone/**/*.e2e.js',
   http_share           : '../e2e/shares/http/*.e2e.js',
   nfs_share            : '../e2e/shares/nfs/*.e2e.js',
   cifs_share           : '../e2e/shares/cifs/*.e2e.js',
   disk_share           : '../e2e/shares/generic_disk/*.e2e.js',
   lun                  : '../e2e/shares/lun/*.e2e.js',
   hosts                : '../e2e/hosts/**/*.e2e.js',
   users                : '../e2e/users/**/*.e2e.js',
   auth                 : '../e2e/auth/*.e2e.js',
   cmdlogs              : '../e2e/commandLogs/**/*.e2e.js',
   fs_wiz_btrfs_nfs     : '../e2e/wizards/file/fileStorage_btrfs_nfs.e2e.js',
   fs_wiz_ext_cifs      : '../e2e/wizards/file/fileStorage_ext_cifs.e2e.js',
   blockStorage         : '../e2e/wizards/block/blockStorage.e2e.js',
   vmStorage_xfs_nfs    : '../e2e/wizards/vm/vmStorage_xfs_nfs.e2e.js',
   //note: please disable zvol suites if you do not have at least one zfs pool configured!
   fs_wiz_zfs           : '../e2e/wizards/file/zfs/*.e2e.js'
   zvol_add             : '../e2e/volumes/zvol/zvol.e2e.js',
   zvol_snap            : '../e2e/volumes/zvol/zvol_snap.e2e.js',
   zvol_share           : '../e2e/volumes/zvol/zvol_share.e2e.js',
   blockStorage_zfs     : '../e2e/wizards/block/zfs/blockStorage_zfs.e2e.js'

  },

  onPrepare: function(){
    browser.driver.manage().window().maximize();
  },
};
