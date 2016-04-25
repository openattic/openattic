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

app.controller("CephPoolsCtrl", function ($scope, $state, cephPoolsService, cephClustersService) {
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
  });

  //var updateResults = function (res, clusterId) {
  //  res.results.forEach(function (pool, index) {
  //    pool.used = pool.num_bytes / pool.max_avail * 100;
  //    pool.unused = 100 - pool.used;
  //    pool.free = pool.max_avail - pool.num_bytes;
  //    res.results[index] = pool;
  //  });
  //  if ($scope.pools.hasOwnProperty("results")) {
  //    // Does the pool contains information about antother cluster?
  //    var otherClusterPools = $scope.pools.results.filter(function (pool) {
  //      return pool.cluster.id !== clusterId;
  //    });
  //
  //    if (otherClusterPools.length === $scope.pools.results.length) {
  //      //do a merge
  //      res.count += $scope.pools.count;
  //      $scope.pools.results.forEach(function (pool) {
  //        res.results.push(pool);
  //      });
  //    }
  //  }
  //  return res;
  //};

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
            $scope.pools = res;
          });
    }
  });

  $scope.$watch("filterConfig", function () {
    //Paginator
    //  .clusters()
    //  .$promise
    //  .then(function (res) {
    //    $scope.clusters = res.results;
    //    $scope.clusters.forEach(function (cluster) {
    //      Paginator
    //        .pools({
    //          id: cluster.fsid,
    //          page: $scope.filterConfig.page + 1,
    //          pageSize: $scope.filterConfig.entries,
    //          search: $scope.filterConfig.search,
    //          ordering: ($scope.filterConfig.sortorder === "ASC" ? "" : "-") + $scope.filterConfig.sortfield,
    //          upper__isnull: "True"
    //        })
    //        .$promise
    //        .then(function (res) {
    //          $scope.pools = updateResults(res, cluster.fsid);
    //        })
    //        .catch(function (error) {
    //          console.log("Ceph has no pools", error);
    //        });
    //    });
    //  })
    //  .catch(function () {
    //    $scope.clusters = false;
    //    console.log("Ceph not available.");
    //  });
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
