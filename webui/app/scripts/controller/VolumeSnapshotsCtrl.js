/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * This package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
"use strict";

var app = angular.module("openattic");
app.controller("VolumeSnapshotsCtrl", function ($scope, $state, VolumeService, SnapshotService, $modal,
    poolCheckingService) {
  $scope.snapshotsData = {};

  $scope.source = poolCheckingService.get($scope.selection);

  $scope.snapshotsFilter = {
    page: 0,
    entries: 10,
    search: "",
    sortfield: null,
    sortorder: null,
    volume: null
  };

  $scope.snapshotsSelection = {};

  $scope.$watch("selection.item", function (selitem) {
    $scope.snapshotsFilter.volume = selitem;
  });

  $scope.$watch("snapshotsFilter", function () {
    if (!$scope.snapshotsFilter.volume) {
      return;
    }
    SnapshotService.filter({
      page: $scope.snapshotsFilter.page + 1,
      pageSize: $scope.snapshotsFilter.entries,
      search: $scope.snapshotsFilter.search,
      ordering: ($scope.snapshotsFilter.sortorder === "ASC" ? "" : "-") + $scope.snapshotsFilter.sortfield,
      snapshot: $scope.snapshotsFilter.volume.id
    })
        .$promise
        .then(function (res) {
          $scope.snapshotsData = res;
        })
        .catch(function (error) {
          console.log("An error occurred", error);
        });
  }, true);

  $scope.addAction = function () {
    $state.go("volumes.detail.snapshots-add");
  };

  $scope.deleteAction = function () {
    var modalInstance = $modal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "templates/volumes/snapshot-delete.html",
      controller: "VolumeSnapshotDeleteCtrl",
      resolve: {
        snap: function () {
          return $scope.snapshotsSelection.item;
        }
      }
    });
    modalInstance.result.then(function () {
      $scope.snapshotsFilter.refresh = new Date();
    });
  };

  $scope.cloneAction = function () {
    var modalInstance = $modal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "templates/volumes/clone.html",
      controller: "VolumeCloneCtrl",
      resolve: {
        volume: function () {
          return $scope.snapshotsSelection.item;
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.snapshotsFilter.refresh = new Date();
    });
  };
});