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

app.controller("CephPoolsCtrl", function ($scope, $state, cephPoolsService, cephClustersService, $timeout) {
  $scope.clusters = null;
  $scope.pools = {};

  $scope.filterConfig = {
    page     : 0,
    entries  : 10,
    search   : "",
    sortfield: null,
    sortorder: null
  };

  $scope.selection = {};
  $scope.selectedCluster = null;

  cephClustersService.get().$promise.then(function (res) {
    $scope.clusters = res.results;
  }).catch(function () {
    $scope.clusters = false;
    console.log("No Ceph cluster available");
  });

  var modifyResult = function (res) {
    res.results.forEach(function (pool) {
      pool.oaUsed = pool.num_bytes / pool.max_avail * 100;
      pool.oaUnused = 100 - pool.oaUsed;
      pool.oaFree = pool.max_avail - pool.num_bytes;
    });

    return res;
  };

  $scope.$watch("selectedCluster", function () {
    if ($scope.selectedCluster) {
      cephPoolsService
          .get(
              {
                id: $scope.selectedCluster.fsid
              }
          )
          .$promise
          .then(function (res) {
            $scope.pools = modifyResult(res);
          });
    }
  });

  $scope.$watch("filterConfig", function () {
    if ($scope.selectedCluster) {
      cephPoolsService
          .get({
            id      : $scope.selectedCluster.fsid,
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
            console.log("No Ceph pools available.", error);
          });
    }
  }, true);

  $scope.$watchCollection("selection", function (selection) {
    var item = selection.item;
    var items = selection.items;

    $scope.multiSelection = Boolean(items);
    $scope.hasSelection = Boolean(item);

    if (!item && !items) {
      $state.go("cephPools");
      return;
    }

    if (item) {
      $state.go("cephPools.detail.status", {
        cephPool: item.id,
        "#"     : "more"
      });
    }
  });
});
