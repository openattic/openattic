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
app.controller("CephRbdCtrl", function ($scope, $state, $filter, cephRbdService, clusterData, registryService,
    cephPoolsService) {
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

  if ($scope.cluster.results.length > 0 && typeof $scope.registry.selectedCluster === "undefined") {
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
            id      : $scope.registry.selectedCluster.fsid,
            page    : $scope.filterConfig.page + 1,
            pageSize: $scope.filterConfig.entries,
            search  : $scope.filterConfig.search,
            ordering: ($scope.filterConfig.sortorder === "ASC" ? "" : "-") + $scope.filterConfig.sortfield
          })
          .$promise
          .then(function (res) {
            cephPoolsService.get({
              id: $scope.registry.selectedCluster.fsid
            }).$promise.then(function (pools) {
              res.results.forEach(function (rbd) {
                pools.results.some(function (pool) {
                  if (pool.id === rbd.pool) {
                    rbd.pool = pool;
                    return true;
                  }
                });
                rbd.oaUsed = rbd.obj_size / rbd.size * 100;
                rbd.oaUnused = 100 - rbd.oaUsed;
                rbd.oaFree = rbd.size - rbd.obj_size;
              });
              $scope.rbd = res;
            });
          })
          .catch(function (error) {
            $scope.error = error;
            console.log("An error occurred while loading the ceph rbds.", error);
          });
    }
  };

  $scope.$watch("filterConfig", function (newValue, oldValue) {
    if (angular.equals(newValue, oldValue)) {
      return;
    }

    $scope.getRbdList();
  }, true);

  $scope.$watchCollection("selection", function (selection) {
    var item = selection.item;
    var items = selection.items;

    $scope.multiSelection = Boolean(items);
    $scope.hasSelection = Boolean(item);

    if (!item && !items) {
      $state.go("cephRbds");
      return;
    }

    if (item) {
      $state.go("cephRbds.detail.details", {
        cephRbd: item.id,
        "#"    : "more"
      });
    }
  });
});
