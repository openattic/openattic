"use strict";

angular.module("openattic", [
  "ngResource",
  "ngSanitize",
  "ui.router",
  "ui.bootstrap",
  "ui.sortable",
  "ui.dashboard",
  "ngTagsInput",
  "ncy-angular-breadcrumb",
  "angular-md5",
  "openattic.auth",
  "openattic.apirecorder",
  "openattic.datatable",
  "openattic.graph",
  "openattic.sizeparser",
  "openattic.extensions",
  "openattic.todowidget",
  "openattic.clusterstatuswidget",
  "openattic.oaWizards",
  "openattic.userinfo",
  "openattic.required",
  "smartadmin.smartmenu"
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