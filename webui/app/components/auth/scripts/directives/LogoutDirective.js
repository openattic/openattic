"use strict";

var app = angular.module("openattic.auth");
app.directive("logout", function () {
  return {
    template: [
      "<a title=\"Sign Out\" ng-click=\"handleLogout()\">",
      "<i class=\"fa fa-sign-out\"></i>",
      "</a>"
    ].join(""),
    controller: function ($scope, $rootScope, $state, authService) {
      $scope.handleLogout = function () {
        authService.logout()
        .$promise
        .then(function () {
          $rootScope.user = null;
          $state.go("login");
        });
      };
    }
  };
});