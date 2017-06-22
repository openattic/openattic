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

var app = angular.module("openattic.cephRbd");
app.controller("CephRbdCtrl", function ($scope, $state, $filter, $uibModal, cephRbdService, clusterData,
    registryService, cephPoolsService, Notification, tabViewService) {
  $scope.registry = registryService;
  $scope.cluster = clusterData;
  $scope.rbd = {};
  $scope.error = false;

  $scope.filterConfig = {
    page     : 0,
    entries  : 10,
    search   : "",
    sortfield: null,
    sortorder: null
  };

  $scope.selection = {};

  if (angular.isObject($scope.cluster) && $scope.cluster.results.length > 0 &&
      angular.isUndefined($scope.registry.selectedCluster)) {
    $scope.registry.selectedCluster = $scope.cluster.results[0];
  }

  $scope.getRbdList = function () {
    if ($scope.cluster.results.length > 0 && $scope.registry.selectedCluster) {
      var obj = $filter("filter")($scope.cluster.results, {fsid: $scope.registry.selectedCluster.fsid}, true);
      if (obj.length === 0) {
        $scope.registry.selectedCluster = $scope.cluster.results[0];
      }

      $scope.rbd = {};
      $scope.error = false;

      cephRbdService
          .get({
            clusterId: $scope.registry.selectedCluster.fsid,
            page: $scope.filterConfig.page + 1,
            pageSize: $scope.filterConfig.entries,
            search: $scope.filterConfig.search,
            ordering: ($scope.filterConfig.sortorder === "ASC" ? "" : "-") + $scope.filterConfig.sortfield
          })
          .$promise
          .then(function (res) {
            $scope.rbdFailure = false;
            cephPoolsService.get({
              fsid: $scope.registry.selectedCluster.fsid
            }).$promise.then(function (pools) {
              $scope.poolFailure = false;
              res.results.forEach(function (rbd) {
                pools.results.some(function (pool) {
                  if (pool.id === rbd.pool) {
                    rbd.pool = pool;
                    return true;
                  }
                });
                rbd.free = rbd.size - rbd.used_size;
                rbd.usedPercent = rbd.used_size / rbd.size * 100;
                rbd.freePercent = rbd.free / rbd.size * 100;
              });
              $scope.rbd = res;
            }).catch(function (poolError) {
              if (!$scope.poolFailure) {
                $scope.poolFailure = true;
                $scope.poolFailureTitle = poolError.status + ": " + poolError.statusText.toLowerCase();
                $scope.poolFailureError = poolError;
              }
            });
          })
          .catch(function (rbdError) {
            if (!$scope.rbdFailure) {
              $scope.rbdFailure = true;
              $scope.rbdFailureTitle = rbdError.status + ": " + rbdError.statusText.toLowerCase();
              $scope.rbdFailureError = rbdError;
            }
          });
    }
  };

  $scope.tabData = {
    active: 0,
    tabs: {
      status: {
        show: "selection.item",
        state: "cephRbds.detail.details",
        class: "tc_statusTab",
        name: "Status"
      },
      statistics: {
        show: "selection.item",
        state: "cephRbds.detail.statistics",
        class: "tc_statisticsTab",
        name: "Statistics"
      }
    }
  };
  $scope.tabConfig = {
    type: "cephRbds",
    linkedBy: "id",
    jumpTo: "more"
  };
  tabViewService.setScope($scope);
  $scope.changeTab = tabViewService.changeTab;

  $scope.$watch("filterConfig", function (newValue, oldValue) {
    if (angular.equals(newValue, oldValue)) {
      return;
    }

    $scope.getRbdList();
  }, true);

  $scope.$watchCollection("selection.items", function (items) {
    $scope.multiSelection = items && items.length > 1;
    $scope.hasSelection = items && items.length === 1;

    if (!items || items.length !== 1) {
      $state.go("cephRbds");
      return;
    }

    if ($state.current.name === "cephRbds") {
      $scope.changeTab("cephRbds.detail.details");
    } else {
      $scope.changeTab($state.current.name);
    }
  });

  $scope.addAction = function () {
    $state.go("rbds-add", {
      clusterId: $scope.registry.selectedCluster.fsid
    });
  };

  $scope.deleteAction = function () {
    if (!$scope.hasSelection && !$scope.multiSelection) {
      return;
    }
    var modalInstance = $uibModal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "components/ceph-rbd/templates/delete.html",
      controller: "RbdDelete",
      resolve: {
        rbdSelection: function () {
          return $scope.selection.items;
        },
        clusterId: function () {
          return $scope.registry.selectedCluster.fsid;
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.filterConfig.refresh = new Date();
    });
  };
});
