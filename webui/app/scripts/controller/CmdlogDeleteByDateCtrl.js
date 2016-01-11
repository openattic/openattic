"use strict";

var app = angular.module("openattic");
app.controller("CmdlogDeleteByDateCtrl", function ($scope, CmdlogService, $modalInstance) {
  $scope.datePicker = {
    opened: false,
    maxDate: null,
    dateTime: null,
    format: "dd/MM/yyyy",
    showBtnBar: false
  };

  $scope.options = {
    startingDay: 1
  };

  $scope.open = function ($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.datePicker.maxDate = new Date();
    $scope.datePicker.opened = true;
  };

  $scope.yes = function () {
    CmdlogService.delete({"datetime": $scope.datePicker.dateTime})
      .$promise
      .then(function () {
        $modalInstance.close("deleted");
      }, function (error) {
        console.log("An error occured", error);
      });
  };

  $scope.no = function () {
    $modalInstance.dismiss("cancel");

    $.smallBox({
      title: "Delete log entry",
      content: "<i class=\"fa fa-clock-o\"></i> <i>Cancelled</i>",
      color: "#C46A69",
      iconSmall: "fa fa-times fa-2x fadeInRight animated",
      timeout: 4000
    });
  };
});