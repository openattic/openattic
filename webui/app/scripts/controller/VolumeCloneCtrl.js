"use strict";

var app = angular.module("openattic");
app.controller("VolumeCloneCtrl", function ($scope, VolumeService, SnapshotService, $modalInstance, volume) {
  $scope.volume = volume;
  $scope.clone_obj = {};

  if ("snapshot" in volume) {
    $scope.type = "snapshot";
  } else {
    $scope.type = "volume";
  }

  $scope.clone = function () {
    if ("snapshot" in volume) {
      SnapshotService.clone({
        "id": $scope.volume.id,
        "name": $scope.clone_obj.name
      })
      .$promise
      .then(function () {
        $modalInstance.close("cloned");
      }, function (error) {
        console.log("An error occured", error);
      });
    } else {
      VolumeService.clone({
        "id": $scope.volume.id,
        "name": $scope.clone_obj.name
      })
      .$promise
      .then(function () {
        $modalInstance.close("cloned");
      }, function (error) {
        console.log("An error occured", error);
      });
    }
  };

  $scope.cancel = function () {
    $modalInstance.dismiss("cancel");

    $.smallBox({
      title: "Clone volume",
      content: "<i class=\"fa fa-clock-o\"></i> <i>Cancelled</i>",
      color: "#C46A69",
      iconSmall: "fa fa-times fa-2x fadeInRight animated",
      timeout: 4000
    });
  };
});