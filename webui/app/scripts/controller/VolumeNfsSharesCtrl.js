"use strict";

var app = angular.module("openattic");
app.controller("VolumeNfsSharesCtrl", function ($scope, $state, NfsSharesService, $modal) {
  $scope.nfsData = {};

  $scope.nfsFilter = {
    page: 0,
    entries: 10,
    search: "",
    sortfield: null,
    sortorder: null,
    volume: null
  };

  $scope.nfsSelection = {};

  $scope.$watch("selection.item", function (selitem) {
    $scope.nfsFilter.volume = selitem;
  });

  $scope.$watch("nfsFilter", function () {
    if (!$scope.nfsFilter.volume) {
      return;
    }
    NfsSharesService.filter({
      page: $scope.nfsFilter.page + 1,
      pageSize: $scope.nfsFilter.entries,
      search: $scope.nfsFilter.search,
      ordering: ($scope.nfsFilter.sortorder === "ASC" ? "" : "-") + $scope.nfsFilter.sortfield,
      volume: $scope.nfsFilter.volume.id
    })
        .$promise
        .then(function (res) {
          $scope.nfsData = res;
        })
        .catch(function (error) {
          console.log("An error occurred", error);
        });
  }, true);

  $scope.addNfsAction = function () {
    $state.go("volumes.detail.nfs-add");
  };

  $scope.deleteNfsAction = function () {
    var modalInstance = $modal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "templates/volumes/delete-nfs-share.html",
      controller: "NfsShareDeleteCtrl",
      resolve: {
        share: function () {
          return $scope.nfsSelection.item;
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.nfsFilter.refresh = new Date();
    });
  };
});