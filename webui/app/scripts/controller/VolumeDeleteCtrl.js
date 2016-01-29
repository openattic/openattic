"use strict";

var app = angular.module("openattic");
app.controller("VolumeDeleteCtrl", function ($scope, VolumeService, $modalInstance, volumeSelection, $q) {
  if ($.isArray(volumeSelection)) {
    $scope.volumes = volumeSelection;
  } else {
    $scope.volume = volumeSelection;
  }

  $scope.input = {
    enteredName: "",
    pattern: "yes"
  };

  $scope.delete = function () {
    if ($scope.volume) {
      $scope.volumes = [ $scope.volume ];
    }
    if ($scope.volumes) {
      $scope.deleteVolumes();
    }
  };

  $scope.deleteVolumes = function () {
    var requests = [];
    $scope.volumes.forEach(function (volume) {
      var deferred = $q.defer();
      VolumeService.delete({id: volume.id}, deferred.resolve, deferred.reject);
      requests.push(deferred.promise);
    });
    $q.all(requests).then(function () {
      $modalInstance.close("deleted");
    }, function (error) {
      console.log("An error occured", error);
    });
  };

  $scope.cancel = function () {
    $modalInstance.dismiss("cancel");

    $.smallBox({
      title: "Delete volume",
      content: "<i class=\"fa fa-clock-o\"></i> <i>Cancelled</i>",
      color: "#C46A69",
      iconSmall: "fa fa-times fa-2x fadeInRight animated",
      timeout: 4000
    });
  };
});
