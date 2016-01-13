"use strict";

var app = angular.module("openattic");
app.controller("LunDeleteCtrl", function ($scope, LunService, $modalInstance, lun) {
  $scope.lun = lun;

  $scope.delete = function () {
    LunService.delete({id: $scope.lun.id})
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
      title: "Delete lun",
      content: "<i class=\"fa fa-clock-o\"></i> <i>Cancelled</i>",
      color: "#C46A69",
      iconSmall: "fa fa-times fa-2x fadeInRight animated",
      timeout: 4000
    });
  };
});