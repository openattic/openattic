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

angular.module("openattic", [
  "angular-md5",
  "angular-toasty",
  "ncy-angular-breadcrumb",
  "ngResource",
  "ngSanitize",
  "ngTagsInput",
  "ui.bootstrap",
  "ui.dashboard",
  "ui.router",
  "ui.sortable",
  "ui.tree",
  "openattic.extensions"
]);

var app = angular.module("openattic");
app.config(function ($httpProvider) {
  $httpProvider.defaults.xsrfCookieName = "csrftoken";
  $httpProvider.defaults.xsrfHeaderName = "X-CSRFToken";
});

app.constant("RESPONSIVE", {
  xs: 0,
  sm: 768,
  md: 992,
  lg: 1200
});

app.run(function ($rootScope, $state, UserService) {
  $rootScope.$on("$stateChangeSuccess", function () {
    UserService.current().$promise.then(function () {
      $rootScope.loggedIn = true;
    }).catch(function () {
      $rootScope.loggedIn = false;
    });
  });
  $rootScope.loginActive = function () {
    return !$rootScope.loggedIn;
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
