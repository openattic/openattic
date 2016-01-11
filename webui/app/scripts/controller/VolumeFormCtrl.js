"use strict";

var app = angular.module("openattic");
app.controller("VolumeFormCtrl", function ($scope, $state, VolumeService, PoolService, SizeParserService) {
  $scope.volume = {};
  $scope.data = {
    sourcePool: null,
    megs: "",
    mirrorHost: "",
    mirrorPool: null,
    filesystem: ""
  };
  $scope.supported_filesystems = {};
  $scope.state = {
    created: false,
    mirrored: false,
    formatted: false
  };
  $scope.accordionOpen = {
    properties: true,
    mirror: false
  };
  $scope.selPoolUsedPercent = 0;

  PoolService.query()
    .$promise
    .then(function (res) {
      $scope.pools = res;
    }, function (error) {
      console.log("An error occurred", error);
    });

  $scope.$watch("data.sourcePool", function (sourcePool) {
    if (sourcePool) {
      $scope.volume.source_pool = { id: sourcePool.id };
      $scope.selPoolUsedPercent = parseFloat(sourcePool.usage.used_pcnt).toFixed(2);
      $scope.volumeForm.pool.$setValidity("usablesize", $scope.data.sourcePool.usage.free >= 100);

      new PoolService(sourcePool).$filesystems()
        .then(function (res) {
          $scope.supported_filesystems = res;
        }, function (error) {
          console.log("An error occured", error);
        });
    } else {
      if ($scope.volumeForm) {
        $scope.volumeForm.pool.$setValidity("usablesize", true);
      }
    }
  });
  $scope.$watch("data.megs", function (megs) {
    $scope.volume.megs = SizeParserService.parseInt(megs);
  });

  var goToListView = function () {
    $state.go("volumes");
  };

  $scope.submitAction = function (volumeForm) {
    $scope.submitted = true;
    if (volumeForm.$valid) {
      if (!$scope.state.created) {
        if ($scope.data.filesystem !== "") {
          $scope.volume.filesystem = $scope.data.filesystem;
        }
        VolumeService.save($scope.volume)
          .$promise
          .then(function (res) {
            $scope.volume = res;
            $scope.state.created = true;
            $scope.state.formatted = $scope.volume.is_filesystemvolume;
            goToListView();
          }, function (error) {
            console.log("An error occured", error);
          });
      } else if (!$scope.state.mirrored && $scope.data.mirrorHost !== "") {
        $.smallBox({
          title: "Mirror Volume",
          content: "<i class=\"fa fa-clock-o\"></i> <i>Sorry, we haven\'t implemented that yet.</i>",
          color: "#C46A69",
          iconSmall: "fa fa-times fa-2x fadeInRight animated",
          timeout: 4000
        });
      } else if (!$scope.state.formatted) {
        new VolumeService({
          id: $scope.volume.id,
          filesystem: $scope.data.filesystem
        }).$update()
          .then(function (res) {
            $scope.volume = res;
            $scope.state.formatted = true;
            goToListView();
          }, function (error) {
            console.log("An error occured", error);
          });
      }
    }
  };

  $scope.cancelAction = function () {
    goToListView();
  };
});