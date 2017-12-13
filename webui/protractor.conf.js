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
"use strict";
var config = require("./e2e/configs.js");
var HtmlScreenshotReporter = require("protractor-jasmine2-screenshot-reporter");
var failFast = require("protractor-fail-fast");

var allSuites = {
  // base suites - They should always be able to run.
  general              : "./e2e/base/general/**/general.e2e.js",
  datatable            : "./e2e/base/datatable/**/*.e2e.js",
  // feedback          : "./e2e/base/feedback/**/feedback.e2e.js",
  pagination           : "./e2e/base/pagination/**/*.e2e.js",
  settings             : "./e2e/base/settings/*.e2e.js",
  users                : "./e2e/base/users/**/*.e2e.js",
  auth                 : "./e2e/base/auth/*.e2e.js",
  task_queue_directive : "./e2e/base/taskqueue/task_queue_directive.e2e.js",
  task_queue_dialog    : "./e2e/base/taskqueue/task_queue_dialog.e2e.js",
  task_queue_deletion  : "./e2e/base/taskqueue/task_queue_deletion.e2e.js",
  // ceph suites - They only run if a ceph pool is configured.
  ceph_clusters        : "./e2e/ceph/ceph_clusters.e2e.js",
  ceph_pools           : "./e2e/ceph/pools/ceph_pools.e2e.js",
  ceph_pool_form       : "./e2e/ceph/pools/ceph_pool_form.e2e.js",
  ceph_pool_creation   : "./e2e/ceph/pools/ceph_pool_creation.e2e.js",
  ceph_pool_edit       : "./e2e/ceph/pools/ceph_pool_edit.e2e.js",
  ec_profiles          : "./e2e/ceph/pools/ec_profile/ec_profiles.e2e.js",
  ceph_osds            : "./e2e/ceph/osds/*.e2e.js",
  ceph_rbds            : "./e2e/ceph/rbds/ceph_rbds.e2e.js",
  ceph_rbd_creation    : "./e2e/ceph/rbds/ceph_rbd_creation.e2e.js",
  ceph_rbd_form        : "./e2e/ceph/rbds/ceph_rbd_form.e2e.js",
  ceph_iscsi           : "./e2e/ceph/iscsi/*.e2e.js",
  ceph_nfs             : "./e2e/ceph/nfs/*.e2e.js",
  ceph_nodes           : "./e2e/ceph/nodes/*.e2e.js",
  ceph_rgw             : "./e2e/ceph/rgw/*.e2e.js"
};

var categories = {
  base: {
    isAvailable: true,
    startsWith: "./e2e/base"
  },
  ceph: {
    isAvailable: config.cephCluster && Object.keys(config.cephCluster).length > 0,
    startsWith: "./e2e/ceph"
  }
};

var suites = {};
for (var suiteName in allSuites) {
  for (var category in categories) {
    var path = allSuites[suiteName];
    if (categories[category].isAvailable && path.startsWith(categories[category].startsWith)) {
      suites[suiteName] = path;
      break;
    }
  }
}

var reporter = new HtmlScreenshotReporter({
  dest: config.outDir || "/tmp/openattic",
  filename: "report.html",
  reportOnlyFailedSpecs: false,
  preserveDirectory: config.preserveDirectory === undefined ? true : config.preserveDirectory,
  captureOnlyFailedSpecs: config.captureOnlyFailedSpecs === undefined ? false : config.captureOnlyFailedSpecs
});

exports.config = {
  plugins: [
    failFast.init()
  ],

  seleniumAddress: "http://localhost:4444/wd/hub",
  jasmineNodeOpts: {
    defaultTimeoutInterval: 360000
  },
  framework: "jasmine2",
  allScriptsTimeout: config.allScriptsTimeout || 60000,
  suites: suites,

  // Setup the report before any tests start
  beforeLaunch: () => {
    return new Promise(resolve => {
      reporter.beforeLaunch(resolve);
    });
  },

  onPrepare: () => {
    browser.driver.manage().window().maximize();

    // Assign the test reporter to each running instance
    jasmine.getEnv().addReporter(reporter);
  },

  // Close the report after all tests finish
  afterLaunch: exitCode => {
    return new Promise(resolve => {
      reporter.afterLaunch(resolve.bind(this, exitCode));
      failFast.clean(); // Removes the fail file once all test runners have completed.
    });
  }
};
