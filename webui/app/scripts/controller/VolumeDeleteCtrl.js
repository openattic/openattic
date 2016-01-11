angular.module("openattic")
  .controller("VolumeDeleteCtrl", function($scope, VolumeService, $modalInstance, volumeSelection) {
    "use strict";

    if ($.isArray(volumeSelection)) {
      $scope.volumes = volumeSelection;
    } else {
      $scope.volume = volumeSelection;
    }

    $scope.input = {
      enteredName: ""
    };

    $scope.delete = function () {
      if ($scope.volume) {
        $scope.deleteOne();
      } else if ($scope.volumes) {
        $scope.deleteMulti();
      }
    };

    $scope.deleteOne = function () {
      VolumeService
        .delete({id: $scope.volume.id})
        .$promise
        .then(function () {
          $modalInstance.close("deleted");
        }, function (error) {
          console.log("An error occured", error);
        });
    };

    $scope.deleteMulti = function () {
      $scope.volumes.forEach(function (volume) {
        VolumeService
          .delete({id: volume.id})
          .$promise
          .then(function () {
            $modalInstance.close("deleted");
          }, function (error) {
            console.log("An error occured", error);
          });
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
