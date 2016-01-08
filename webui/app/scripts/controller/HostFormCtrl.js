"use strict";

var app = angular.module("openattic");
app.controller("HostFormCtrl", function ($scope, $state, $stateParams, HostService) {
  var goToListView = function () {
    $state.go("hosts");
  };

  if (!$stateParams.host) {
    $scope.host = {};
    $scope.editing = false;

    $scope.submitAction = function (hostForm) {
      $scope.submitted = true;
      if (hostForm.$valid === true) {
        HostService.save($scope.host)
          .$promise
          .then(function () {
            goToListView();
          }, function (error) {
            console.log("An error occured", error);
          });
      }
    };
  } else {
    $scope.editing = true;
    $scope.data = {
      peerHostUrl: "",
      iscsiIqn: "",
      fcWwn: ""
    };

    HostService.get({id: $stateParams.host})
      .$promise
      .then(function (res) {
        $scope.host = res;
      }, function (error) {
        console.log("An error occurred", error);
      });

    $scope.submitAction = function (hostForm) {
      $scope.submitted = true;
      if (hostForm.$valid === true) {
        HostService.update({id: $scope.host.id}, $scope.host)
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