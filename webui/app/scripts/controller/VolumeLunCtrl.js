"use strict";

var app = angular.module("openattic");
app.controller("VolumeLunCtrl", function ($scope, $state, LunService) {
  $scope.lunData = {};

  $scope.lunFilter = {
    page: 0,
    entries: 10,
    search: "",
    sortfield: null,
    sortorder: null,
    volume: null
  };

  $scope.lunSelection = {};

  $scope.$watch("selection.item", function (selitem) {
    $scope.lunFilter.volume = selitem;
  });

  $scope.$watch("lunFilter", function () {
    if (!$scope.lunFilter.volume) {
      return;
    }
    LunService.filter({
      page: $scope.lunFilter.page + 1,
      page_size: $scope.lunFilter.entries,
      search: $scope.lunFilter.search,
      ordering: ($scope.lunFilter.sortorder === "ASC" ? "" : "-") + $scope.lunFilter.sortfield,
      volume: $scope.lunFilter.volume.id
    })
    .$promise
    .then(function (res) {
      $scope.lunData = res;
    })
    .catch(function (error) {
      console.log("An error occurred", error);
    });
  }, true);
  $scope.addLunAction = function () {
    $state.go("volumes.detail.luns-add");
  };

  $scope.deleteLunAction = function () {
    $.SmartMessageBox({
      title: "Delete LUN",
      content: "Do you really want to delete the LUN ACL for \"" + $scope.lunSelection.item.host.title + "\"?",
      buttons: "[No][Yes]"
    }, function (ButtonPressed) {
      if (ButtonPressed === "Yes") {
        LunService.delete({id: $scope.lunSelection.item.id})
          .$promise
          .then(function () {
            $scope.lunFilter.refresh = new Date();
          }, function (error) {
            console.log("An error occured", error);
          });
      }
      if (ButtonPressed === "No") {
        $.smallBox({
          title: "Delete LUN",
          content: "<i class=\"fa fa-clock-o\"></i> <i>Cancelled</i>",
          color: "#C46A69",
          iconSmall: "fa fa-times fa-2x fadeInRight animated",
          timeout: 4000
        });
      }
    });
  };
});