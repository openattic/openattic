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
  general              : '../e2e/base/general/**/general.e2e.js',
  datatable            : '../e2e/base/datatable/**/*.e2e.js',
  pagination           : '../e2e/base/pagination/**/*.e2e.js',
  users                : '../e2e/base/users/**/*.e2e.js',
  auth                 : '../e2e/base/auth/*.e2e.js',
  cmdlogs              : '../e2e/base/commandLogs/**/*.e2e.js',
  task_queue_directive : '../e2e/base/taskqueue/task_queue_directive.e2e.js',
  task_queue_dialog    : '../e2e/base/taskqueue/task_queue_dialog.e2e.js',
  task_queue_deletion  : '../e2e/base/taskqueue/task_queue_deletion.e2e.js',
  // ceph suites - They only run if a ceph pool is configured.
  ceph_pools           : '../e2e/ceph/pools/ceph_pools.e2e.js',
  ceph_pool_form       : '../e2e/ceph/pools/ceph_pool_form.e2e.js',
  ceph_pool_creation   : '../e2e/ceph/pools/ceph_pool_creation.e2e.js',
  ceph_osds            : '../e2e/ceph/ceph_osds.e2e.js',
  ceph_rbds            : '../e2e/ceph/rbds/ceph_rbds.e2e.js',
  ceph_rbd_creation    : '../e2e/ceph/rbds/ceph_rbd_creation.e2e.js',
  ceph_rbd_form        : '../e2e/ceph/rbds/ceph_rbd_form.e2e.js',
  ceph_iscsi           : '../e2e/ceph/iscsi/*.e2e.js'
};

var categories = {
  base: {
    isAvailable: true,
    startsWith: '../e2e/base'
  },
  ceph: {
    isAvailable: config.cephCluster && Object.keys(config.cephCluster).length > 0,
    startsWith: '../e2e/ceph'
  }
};

var suites = {};
for(var suiteName in allSuites){
  for(var category in categories){
    var path = allSuites[suiteName];
    if(categories[category].isAvailable && path.startsWith(categories[category].startsWith)){
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
  allScriptsTimeout: 60000,
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
