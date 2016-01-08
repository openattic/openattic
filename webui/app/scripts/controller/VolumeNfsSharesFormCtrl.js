"use strict";

var app = angular.module("openattic");
app.controller("VolumeNfsSharesFormCtrl", function ($scope, $state, $stateParams, NfsSharesService) {
  if (!$stateParams.share) {
    $scope.share = {
      "volume": {id: $scope.selection.item.id},
      "path": $scope.selection.item.path,
      "address": "",
      "options": "rw,no_subtree_check,no_root_squash"
    };

    $scope.submitAction = function (shareForm) {
      $scope.submitted = true;
      if (shareForm.$valid === true) {
        NfsSharesService.save($scope.share)
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

  var goToListView = function () {
    $state.go("volumes.detail.nfs");
  };
});