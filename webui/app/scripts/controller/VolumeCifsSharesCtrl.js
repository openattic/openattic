"use strict";

var app = angular.module("openattic");
app.controller("VolumeCifsSharesCtrl", function ($scope, $state, CifsSharesService, $modal) {
  $scope.cifsData = {};

  $scope.cifsFilter = {
    page: 0,
    entries: 10,
    search: "",
    sortfield: null,
    sortorder: null,
    volume: null
  };

  $scope.cifsSelection = {};

  $scope.$watch("selection.item", function (selitem) {
    $scope.cifsFilter.volume = selitem;
  });

  $scope.$watch("cifsFilter", function () {
    if (!$scope.cifsFilter.volume) {
      return;
    }
    CifsSharesService.filter({
      page: $scope.cifsFilter.page + 1,
      pageSize: $scope.cifsFilter.entries,
      search: $scope.cifsFilter.search,
      ordering: ($scope.cifsFilter.sortorder === "ASC" ? "" : "-") + $scope.cifsFilter.sortfield,
      volume: $scope.cifsFilter.volume.id
    })
        .$promise
        .then(function (res) {
          $scope.cifsData = res;
        })
        .catch(function (error) {
          console.log("An error occurred", error);
        });
  }, true);

  $scope.addCifsAction = function () {
    $state.go("volumes.detail.cifs-add");
  };

  $scope.editCifsAction = function () {
    $state.go("volumes.detail.cifs-edit", {share: $scope.cifsSelection.item.id});
  };

  $scope.deleteCifsAction = function () {
    var modalInstance = $modal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "templates/volumes/delete-cifs-share.html",
      controller: "CifsShareDeleteCtrl",
      resolve: {
        share: function () {
          return $scope.cifsSelection.item;
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.cifsFilter.refresh = new Date();
    });
  };
});