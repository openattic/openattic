"use strict";

var app = angular.module("openattic");
app.controller("VolumeLunFormCtrl", function ($scope, $state, $stateParams, $filter, LunService, HostService,
    InitiatorService) {
  var goToListView = function () {
    $state.go("volumes.detail.luns");
  };

  $scope.share = {
    "volume": {id: $scope.selection.item.id},
    "host": null,
    "lun_id": "0"
  };

  HostService.query()
    .$promise
    .then(function (res) {
      $scope.hosts = $filter("initiatorsonly")(res);
    }, function (error) {
      console.log("An error occurred", error);
    });

  $scope.$watch("share.host", function (host) {
    if (host) {
      InitiatorService.filter({
        host: host.id,
        type: "qla2xxx"
      })
      .$promise
      .then(function (res) {
        $scope.haz_initiator = (res.count > 0);
      }, function (error) {
        console.log("An error occured", error);
      });
    }
  });

  $scope.submitAction = function (shareForm) {
    $scope.submitted = true;
    if (shareForm.$valid === true) {
      LunService.save($scope.share)
        .$promise
        .then(function () {
          goToListView();
        }, function (error) {
          console.log("An error occured", error);
        });
    }
  };

  $scope.cancelAction = function () {
    goToListView();
  };
});