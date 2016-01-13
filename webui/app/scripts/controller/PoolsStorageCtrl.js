"use strict";

var app = angular.module("openattic");
app.controller("PoolStorageCtrl", function ($scope, $stateParams, PoolService) {
  $scope.$watch("selection.item", function (item) {
    if (item) {
      $scope.storage = PoolService.storage({id: item.id});
    }
  });
});