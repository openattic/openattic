"use strict";

var app = angular.module("openattic");
app.controller("CmdlogCtrl", function ($scope, $state, CmdlogService, $modal) {
  $scope.data = {};

  $scope.filterConfig = {
    page: 0,
    entries: 10,
    search: "",
    sortfield: null,
    sortorder: null
  };

  $scope.selection = {};

  $scope.$watch("filterConfig", function () {
    CmdlogService.filter({
      page: $scope.filterConfig.page + 1,
      page_size: $scope.filterConfig.entries,
      search: $scope.filterConfig.search,
      ordering: ($scope.filterConfig.sortorder === "ASC" ? "" : "-") + $scope.filterConfig.sortfield
    })
      .$promise
      .then(function (res) {
        $scope.data = res;
      })
      .catch(function (error) {
        console.log("An error occurred", error);
      });
  }, true);

  $scope.$watchCollection("selection.items", function (items) {
    if (items !== undefined) {
      $scope.hasSelection = items.length > 0;
    }
  });

  $scope.deleteAction = function () {
    var modalInstance = $modal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "templates/cmdlogs/delete-by-selection.html",
      controller: "CmdlogDeleteBySelectionCtrl",
      resolve: {
        selection: function () {
          return $scope.selection.items;
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.filterConfig.refresh = new Date();
    });
  };

  $scope.deleteByDateAction = function () {
    var modalInstance = $modal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "templates/cmdlogs/delete-by-date.html",
      controller: "CmdlogDeleteByDateCtrl"
    });

    modalInstance.result.then(function () {
      $scope.filterConfig.refresh = new Date();
    });
  };
});