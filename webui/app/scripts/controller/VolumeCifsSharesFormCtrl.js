"use strict";

var app = angular.module("openattic");
app.controller("VolumeCifsSharesFormCtrl", function ($scope, $state, $stateParams, CifsSharesService) {
  var goToListView = function () {
    $state.go("volumes.detail.cifs");
  };
  $scope.domainconfig = {};

  CifsSharesService.domainconfig()
  .$promise
  .then(function (res) {
    $scope.domainconfig = res;
  });

  if (!$stateParams.share) {
    $scope.share = {
      "volume": {id: $scope.selection.item.id},
      "name": $scope.selection.item.name,
      "path": $scope.selection.item.path,
      "available": true,
      "browseable": true,
      "writeable": true,
      "guest_ok": false
    };

    $scope.editing = false;

    $scope.submitAction = function (shareForm) {
      $scope.submitted = true;
      if (shareForm.$valid === true) {
        CifsSharesService.save($scope.share)
          .$promise
          .then(function () {
            goToListView();
          }, function (error) {
            console.log("An error occured", error);
          });
      }
    };

    $scope.$watch("domainconfig", function (domcfg) {
      $scope.share.guest_ok = (domcfg.domain === "");
    });
  } else {
    $scope.editing = true;

    CifsSharesService.get({id: $stateParams.share})
      .$promise
      .then(function (res) {
        $scope.share = res;
      }, function (error) {
        console.log("An error occurred", error);
      });

    $scope.submitAction = function (shareForm) {
      $scope.submitted = true;
      if (shareForm.$valid === true) {
        CifsSharesService.update({id: $scope.share.id}, $scope.share)
          .$promise
          .then(function () {
            goToListView();
          }, function (error) {
            console.log("An error occured", error);
          });
      }
    };
  }

  $scope.cancelAction = function () {
    goToListView();
  };
});