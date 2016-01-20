"use strict";

var app = angular.module("openattic");
app.controller("UserDeleteCtrl", function ($scope, UserService, $modalInstance, user) {
  $scope.user = user;

  $scope.delete = function () {
    UserService.delete({id: $scope.user.id})
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
      title: "Delete user",
      content: "<i class=\"fa fa-clock-o\"></i> <i>Cancelled</i>",
      color: "#C46A69",
      iconSmall: "fa fa-times fa-2x fadeInRight animated",
      timeout: 4000
    });
  };
});