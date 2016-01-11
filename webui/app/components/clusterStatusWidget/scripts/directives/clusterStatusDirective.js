"use strict";

var app = angular.module("openattic.clusterstatuswidget");
app.directive("clusterstatuswidget", function () {
  return {
    restrict: "A",
    scope: true,
    replace: true,
    templateUrl: "components/clusterStatusWidget/templates/clusterstatus.html",
    controller: function () {}
  };
});