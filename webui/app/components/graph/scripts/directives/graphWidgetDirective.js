"use strict";

var app = angular.module("openattic.graph");
app.directive("graphWidget", function () {
  return {
    restrict: "E",
    scope: {
      params: "="
    },
    templateUrl: "components/graph/templates/graphWidget.html",
    controller: function ($scope, GraphProfileService) {
      $scope.profiles = GraphProfileService.getProfiles();

      $scope.setActiveProfile = function (profile) {
        $scope.params.profile = profile;
        delete $scope.params.start;
        delete $scope.params.end;
      };
    }
  };
});