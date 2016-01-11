"use strict";

var app = angular.module("openattic");
app.controller("VolumeStorageCtrl", function ($scope, VolumeService) {
    $scope.$watch("selection.item", function (item) {
      if (item) {
        $scope.storage = VolumeService.storage({id: item.id});
      }
    });
  });