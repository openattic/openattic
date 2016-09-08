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
'use strict';
var config = require('../e2e/configs.js');

var allSuites = {
  // base suites - They should always be able to run.
  general              : '../e2e/base/general/**/*.e2e.js',
  datatable            : '../e2e/base/datatable/**/*.e2e.js',
  pagination           : '../e2e/base/pagination/**/*.e2e.js',
  disks                : '../e2e/base/disks/**/*.e2e.js',
  pools                : '../e2e/base/pools/**/*.e2e.js',
  volumes              : '../e2e/base/volumes/volumes.e2e.js',
  volumes_add          : '../e2e/base/volumes/add/**/*.e2e.js',
  volumes_protection   : '../e2e/base/volumes/protection/**/*.e2e.js',
  volumes_resize       : '../e2e/base/volumes/resize/**/*.e2e.js',
  volumes_multi_delete : '../e2e/base/volumes/delete/**/*.e2e.js',
  snapshot             : '../e2e/base/snapshots/add/**/*.e2e.js',
  snapshot_clone       : '../e2e/base/snapshots/clone/**/*.e2e.js',
  http_share           : '../e2e/base/shares/http/*.e2e.js',
  nfs_share            : '../e2e/base/shares/nfs/*.e2e.js',
  cifs_share           : '../e2e/base/shares/cifs/*.e2e.js',
  lun                  : '../e2e/base/shares/lun/*.e2e.js',
  host_add             : '../e2e/base/hosts/host_add.e2e.js',
  host_form            : '../e2e/base/hosts/host_form_workflow.e2e.js',
  host_wwns            : '../e2e/base/hosts/wwn_validation.e2e.js',
  users                : '../e2e/base/users/**/*.e2e.js',
  auth                 : '../e2e/base/auth/*.e2e.js',
  cmdlogs              : '../e2e/base/commandLogs/**/*.e2e.js',
  fs_wiz_btrfs_nfs     : '../e2e/base/wizards/file/fileStorage_btrfs_nfs.e2e.js',
  fs_wiz_ext_cifs      : '../e2e/base/wizards/file/fileStorage_ext_cifs.e2e.js',
  blockStorage         : '../e2e/base/wizards/block/blockStorage.e2e.js',
  vmStorage_xfs_nfs    : '../e2e/base/wizards/vm/vmStorage_xfs_nfs.e2e.js',
  // ceph suites - They only run if a ceph pool is configured.
  ceph_pools           : '../e2e/ceph/pools/ceph_pools.e2e.js',
  ceph_pool_form       : '../e2e/ceph/pools/ceph_pool_form.e2e.js',
  ceph_pool_creation   : '../e2e/ceph/pools/ceph_pool_creation.e2e.js',
  ceph_osds            : '../e2e/ceph/ceph_osds.e2e.js',
  ceph_rbds            : '../e2e/ceph/rbds/ceph_rbds.e2e.js',
  ceph_rbd_creation    : '../e2e/ceph/rbds/ceph_rbd_creation.e2e.js',
  ceph_rbd_form        : '../e2e/ceph/rbds/ceph_rbd_form.e2e.js',
  // zfs suites - They only run if a zpool is configured.
  fs_wiz_zfs           : '../e2e/zfs/wizards/file/*.e2e.js',
  zvol_add             : '../e2e/zfs/volumes/zvol.e2e.js',
  zvol_snapshot        : '../e2e/zfs/snapshots/add/*.e2e.js',
  zvol_share           : '../e2e/zfs/volumes/zvol_share.e2e.js',
  blockStorage_zfs     : '../e2e/zfs/wizards/block/blockStorage_zfs.e2e.js'
};

var categories = {
  base: {
    isAvailable: true,
    startsWith: '../e2e/base'
  },
  ceph: {
    isAvailable: config.cephCluster && Object.keys(config.cephCluster).length > 0,
    startsWith: '../e2e/ceph'
  },
  zfs: {
    isAvailable: false,
    startsWith: '../e2e/zfs'
  }
};

for(var poolName in config.pools){
  if (config.pools[poolName].poolType === "zpool") {
    categories.zfs.isAvailable = true;
    break;
  }
}

var suites = {};
for(var suiteName in allSuites){
  for(var category in categories){
    var path = allSuites[suiteName];
    if(path.startsWith(categories[category].startsWith)){
      suites[suiteName] = path;
      break;
    }
  }
}

exports.config = {
  seleniumAddress: 'http://localhost:4444/wd/hub',
  jasmineNodeOpts: {
    defaultTimeoutInterval: 360000
  },
  framework: 'jasmine2',

  suites: suites,

  onPrepare: function(){
    browser.driver.manage().window().maximize();
    if(config.outDir){
      var fs = require('fs');
      var path = require('path');
      var errorCount = 0;
      var savePath = path.join(config.outDir, new Date().toJSON().replace(/[-:.]/g, '_'));
      var checkPath = function(callback){
        fs.exists(savePath, function(exists){
          if(!exists){
            fs.mkdir(savePath);
          }
          callback();
        });
      };
      console.log('If any errors appear they will be logged in "' + savePath + '".');
      jasmine.getEnv().addReporter(new function(){
        this.specDone = function(result){
          if(result.failedExpectations.length > 0){
            errorCount++;
            checkPath(function(){
              browser.takeScreenshot().then(function(png){
                var stream = fs.createWriteStream(savePath + '/error' + errorCount + '.png');
                stream.write(new Buffer(png, 'base64'));
                stream.end();
              });
              var stream = fs.createWriteStream(savePath + '/error' + errorCount + '.log');
              var out = new console.Console(stream);
              out.log('Description of the suite:\n', result.description + '\n');
              out.log('Description of the test:\n', result.fullName + '\n\n\n');
              out.log('Failed expectations:' + '\n\n');
              result.failedExpectations.forEach(function(fail){
                out.log('Expected "' + fail.expected + '" but got "' + fail.actual + '" with Matcher "' +
                  fail.matcherName + '"\n');
                out.log('Message:\n' + fail.message + '\n');
                out.log('Call-Stack:\n' + fail.stack + '\n\n');
              });
            });
          }
        };
      });
    }
  }
};
