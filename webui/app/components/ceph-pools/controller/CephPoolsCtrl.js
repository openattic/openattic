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

var app = angular.module("openattic.cephPools");
app.controller("CephPoolsCtrl", function ($scope, $state, $filter, cephPoolsService, clusterData, registryService,
    $uibModal, TabViewService) {
  $scope.registry = registryService;
  $scope.cluster = clusterData;
  $scope.pools = {};
  $scope.error = false;

  $scope.filterConfig = {
    page     : 0,
    entries  : 10,
    search   : "",
    sortfield: null,
    sortorder: null
  };

  $scope.selection = {};

  if ($scope.cluster.results.length > 0 && typeof $scope.registry.selectedCluster === "undefined") {
    $scope.registry.selectedCluster = $scope.cluster.results[0];
  }

  var modifyResult = function (res) {
    res.results.forEach(function (pool) {
      pool.oaUsed = pool.num_bytes / pool.max_avail * 100;
      pool.oaUnused = 100 - pool.oaUsed;
      pool.oaFree = pool.max_avail - pool.num_bytes;
    });

    return res;
  };

  $scope.getPoolList = function () {
    if ($scope.cluster.results.length > 0 && $scope.registry.selectedCluster) {
      var obj = $filter("filter")($scope.cluster.results, {fsid: $scope.registry.selectedCluster.fsid}, true);
      if (obj.length === 0) {
        $scope.registry.selectedCluster = $scope.cluster.results[0];
      }

      $scope.pools = {};
      $scope.error = false;

      cephPoolsService
          .get({
            id      : $scope.registry.selectedCluster.fsid,
            page    : $scope.filterConfig.page + 1,
            pageSize: $scope.filterConfig.entries,
            search  : $scope.filterConfig.search,
            ordering: ($scope.filterConfig.sortorder === "ASC" ? "" : "-") + $scope.filterConfig.sortfield
          })
          .$promise
          .then(function (res) {
            $scope.pools = modifyResult(res);
          })
          .catch(function (error) {
            $scope.error = error;
            console.log("An error occurred while loading the ceph pools.", error);
          });
    }
  };

  $scope.tabData = {
    active: 0,
    tabs: {
      status: {
        show: "selection.item",
        state: "cephPools.detail.status",
        class: "tc_statusTab",
        name: "Status"
      },
      cacheTier: {
        show: "selection.item.tiers.length > 0",
        state: "cephPools.detail.cacheTier",
        class: "tc_cacheTieringTab",
        name: "Status"
      }
    }
  };
  $scope.tabConfig = {
    type: "cephPool",
    linkedBy: "id",
    jumpTo: "more"
  };
  TabViewService.setScope($scope);
  $scope.changeTab = TabViewService.changeTab;

  $scope.$watch("filterConfig", function (newValue, oldValue) {
    if (angular.equals(newValue, oldValue)) {
      return;
    }

    $scope.getPoolList();
  }, true);

  $scope.$watchCollection("selection", function (selection) {
    var item = selection.item;
    var items = selection.items;

    $scope.multiSelection = Boolean(items) && items.length > 1;
    $scope.hasSelection = Boolean(item);

    if (!item && !items) {
      $state.go("cephPools");
      return;
    }

    if (item) {
      $scope.changeTab("cephPools.detail.status");
    }
  });

  $scope.addAction = function () {
    $state.go("ceph-pools-add", {
      clusterId: $scope.registry.selectedCluster.fsid
    });
  };

  $scope.deleteAction = function () {
    if (!$scope.hasSelection && !$scope.multiSelection) {
      return;
    }
    var item = $scope.selection.item;
    var items = $scope.selection.items;
    $scope.deletionDialog(item ? item : items);
  };

  $scope.deletionDialog = function (selection) {
    var modalInstance = $uibModal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "components/ceph-pools/templates/delete-pool.html",
      controller: "CephPoolsDeleteCtrl",
      resolve: {
        cephPoolSelection: function () {
          return selection;
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.filterConfig.refresh = new Date();
    });
  };
});
