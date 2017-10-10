/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 SUSE LLC
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

var app = angular.module("openattic.cephRgw");
app.controller("CephRgwBucketsCtrl", function ($scope, $state, $uibModal,
    $stateParams, cephRgwBucketService, oaTabSetService, Notification) {
  $scope.buckets = {};
  $scope.error = false;
  $scope.filterConfig = {
    page: 0,
    entries: undefined,
    search: "",
    sortfield: "bucket",
    sortorder: "ASC"
  };
  $scope.selection = {};
  $scope.tabData = {
    active: 0,
    tabs: {
      status: {
        show: "$ctrl.selection.item",
        state: "ceph-rgw-buckets.detail.details",
        class: "tc_statusTab",
        name: "Details"
      }
    }
  };
  $scope.tabConfig = {
    type: "ceph-rgw-buckets",
    linkedBy: "bucket",
    jumpTo: "more"
  };

  // Apply filter parameters given via non-URL route parameters.
  Object.keys($scope.filterConfig).forEach(function (param) {
    if (angular.isDefined($stateParams[param])) {
      $scope.filterConfig[param] = $stateParams[param];
    }
  });

  $scope.$watch("filterConfig", function (newValue, oldValue) {
    if (angular.equals(newValue, oldValue)) {
      return;
    }
    cephRgwBucketService.filter({
      page: $scope.filterConfig.page + 1,
      pageSize: $scope.filterConfig.entries,
      search: $scope.filterConfig.search,
      ordering: ($scope.filterConfig.sortorder === "ASC" ? "" : "-") + $scope.filterConfig.sortfield
    })
      .$promise
      .then(function (res) {
        $scope.buckets = res;
      })
      .catch(function (error) {
        $scope.error = error;
      });
  }, true);

  $scope.onSelectionChange = function (selection) {
    $scope.selection = selection;
    var items = selection.items;

    $scope.multiSelection = items && items.length > 1;
    $scope.hasSelection = items && items.length === 1;

    if (!items || items.length !== 1) {
      $state.go("ceph-rgw-buckets");
      return;
    }

    if ($state.current.name === "ceph-rgw-buckets") {
      oaTabSetService.changeTab("ceph-rgw-buckets.detail.details",
        $scope.tabData, $scope.tabConfig, selection);
    } else {
      oaTabSetService.changeTab($state.current.name, $scope.tabData,
        $scope.tabConfig, selection);
    }
  };

  $scope.addAction = function () {
    $state.go("ceph-rgw-bucket-add");
  };

  $scope.editAction = function () {
    $state.go("ceph-rgw-bucket-edit", {bucket: $scope.selection.item.bucket});
  };

  $scope.deleteAction = function () {
    if (!$scope.hasSelection && !$scope.multiSelection) {
      return;
    }
    // Check if the selected buckets are referenced.
    if ($scope.selection.items && $scope.selection.items.length > 0) {
      const selectionIsReferenced = $scope.selection.items.some((item) => {
        return item.is_referenced;
      });
      if (selectionIsReferenced) {
        const numBuckets = $scope.selection.items.length;
        Notification.warning({
          title: (numBuckets > 1) ? "Delete buckets" : "Delete bucket",
          msg: numBuckets + " bucket(s) can not be deleted because they are shared via NFS."
        });
        return;
      }
    }
    var modalInstance = $uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      template: require("../templates/cephRgwBucketDeleteModal.html"),
      controller: "CephRgwBucketDeleteModalCtrl",
      resolve: {
        bucketSelection: function () {
          return $scope.selection.items;
        }
      }
    });
    modalInstance.result.then(function () {
      // Reload the bucket list.
      $scope.filterConfig.refresh = new Date();
    });
  };
});
