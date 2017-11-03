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

import "bootstrap/dist/js/bootstrap";
import angular from "angular";
import "angular-md5";
import "angular-toasty/dist/angular-toasty";
import "angular-breadcrumb";
import "angular-animate";
import "angular-resource";
import "angular-sanitize";
import "ngstorage";
import "ng-tags-input";
import "angular-ui-bootstrap";
import "@uirouter/angularjs";
import "angular-ui-sortable";
import "angular-bootstrap-toggle/dist/angular-bootstrap-toggle";
import "angular-ui-tree";
import globalConfig from "globalConfig";

require("./module_openattic-ceph");
require("./module_openattic-core");

angular.module("openattic", [
  "angular-md5",
  "angular-toasty",
  "ncy-angular-breadcrumb",
  "ngAnimate",
  "ngResource",
  "ngSanitize",
  "ngStorage",
  "ngTagsInput",
  "ui.bootstrap",
  "ui.router",
  "ui.sortable",
  "ui.toggle",
  "ui.tree",
  "openattic.core",
  "openattic.ceph"
]);

var app = angular.module("openattic");
// Start configuration

// End configuration

app.config(function ($httpProvider) {
  $httpProvider.defaults.xsrfCookieName = "csrftoken";
  $httpProvider.defaults.xsrfHeaderName = "X-CSRFToken";
});

app.run(function ($rootScope, usersService, $state, $transitions,
    authUserService, $q) {

  $transitions.onStart({}, (trans) => {
    const deferred = $q.defer();

    usersService.current()
      .$promise
      .then((user) => {
        authUserService.set(user);
        if (trans.to().name === "login") {
          deferred.resolve($state.target("dashboard", undefined, { location: true }));
        } else {
          deferred.resolve(true);
        }
      }).catch((error) => {
        error.ignoreStatusCode(401);
        authUserService.remove();

        if (trans.to().name === "login") {
          deferred.resolve(true);
        } else {
          deferred.resolve($state.target("login", undefined, { location: true }));
        }
      });

    return deferred.promise;
  });

  $rootScope.loginActive = function () {
    return !authUserService.isLoggedIn();
  };
  var hostname = window.location.host.split(".")[0];
  // check if the hostname looks like the first octet of an IP address
  // and only change pageTitle if it does not
  //if (parseInt(hostname, 10) !== hostname) {
  if (hostname.search(/^\d{1,3}$/) === -1) {
    $rootScope.pageTitle = hostname + " - openATTIC";
  } else {
    $rootScope.pageTitle = "openATTIC";
  }
});

app.config(function ($sceDelegateProvider) {
  $sceDelegateProvider.resourceUrlWhitelist([
    // Allow same origin resource loads.
    "self",
    // Allow loading grafana
    globalConfig.API.URL + "**"
  ]);
});

requireAll(require.context("./config/", true, /^(?!.*\.spec\.js$).*\.js$/));
requireAll(require.context("./directive/", true, /^(?!.*\.spec\.js$).*\.js$/));
requireAll(require.context("./filters/", true, /^(?!.*\.spec\.js$).*\.js$/));
requireAll(require.context("./services/", true, /^(?!.*\.spec\.js$).*\.js$/));
requireAll(require.context("./validators/", true, /^(?!.*\.spec\.js$).*\.js$/));

function requireAll (require) {
  require.keys().forEach(require);
}
