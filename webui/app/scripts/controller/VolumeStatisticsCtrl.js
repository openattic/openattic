"use strict";

var app = angular.module("openattic");
app.controller("VolumeStatisticsCtrl", function ($scope, $state) {
  $scope.$watch(function () {
    return $state.current;
  }, function (current) {
    $scope.state = current;
  });
  $scope.utilparams = {
    profile: null
  };
  $scope.perfparams = {
    profile: null
  };
});