"use strict";

var app = angular.module("openattic");
app.controller("HostDeleteCtrl", function ($scope, HostService, $modalInstance, host) {
    $scope.host = host;

    $scope.delete = function () {
      HostService.delete({id: $scope.host.id})
          .$promise
          .then(function () {
            $modalInstance.close("deleted");
          }, function (error) {
            console.log("An error occured", error);
          });
    };

    $scope.cancel = function () {
      $modalInstance.dismiss("cancel");

      $.smallBox({
        title: "Delete host",
        content: "<i class=\"fa fa-clock-o\"></i> <i>Cancelled</i>",
        color: "#C46A69",
        iconSmall: "fa fa-times fa-2x fadeInRight animated",
        timeout: 4000
      });
    };
  });