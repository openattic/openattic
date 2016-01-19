"use strict";

var app = angular.module("openattic");
app.controller("VolumeHttpSharesFormCtrl", function ($scope, $state, $stateParams, HttpSharesService) {
  var goToListView = function () {
    $state.go("volumes.detail.http");
  };

  if (!$stateParams.share) {
    $scope.share = {
      "volume": {id: $scope.selection.item.id},
      "path": $scope.selection.item.path
    };
    $scope.editing = false;

    $scope.submitAction = function (httpForm) {
      $scope.submitted = true;
      if (httpForm.$valid === true) {
        HttpSharesService.save($scope.share)
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