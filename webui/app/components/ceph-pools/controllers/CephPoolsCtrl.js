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
app.controller("CephPoolsCtrl", function ($scope, $state, Paginator) {
  $scope.clusters = {};
  $scope.pools = {};
  //$scope.pools = [];

  $scope.filterConfig = {
    page: 0,
    entries: 10,
    search: "",
    sortfield: null,
    sortorder: null
  };

  $scope.selection = {};

  var updateResults = function () {
    $scope.pools.results.forEach(function (pool, index) {
      pool.mb_used = pool.kb_used / 1024;
      pool.used = pool.num_bytes / pool.max_avail * 100;
      pool.unused = 100 - pool.used;
      pool.free = pool.max_avail - pool.num_bytes;
      pool.mb_size = pool.max_avail / Math.pow(1024, 2);
      $scope.pools.results[index] = pool;
    });
  };

  $scope.$watch("filterConfig", function () {
    Paginator
      .clusters()
      .$promise
      .then(function (res) {
        $scope.clusters = res.results;
        $scope.clusters.forEach(function (cluster) {
          Paginator
              .pools({
                id: cluster.fsid,
                page: $scope.filterConfig.page + 1,
                pageSize: $scope.filterConfig.entries,
                search: $scope.filterConfig.search,
                ordering: ($scope.filterConfig.sortorder === "ASC" ? "" : "-") + $scope.filterConfig.sortfield,
                upper__isnull: "True"
              })
              .$promise
              .then(function (res) {
                console.log(res);
                $scope.pools = res;
                updateResults();
              })
              .catch(function (error) {
                console.log("Ceph has no pools", error);
              });
        });
      })
      .catch(function () {
        $scope.clusters = false;
        console.log("Ceph not available.");
      });
  }, true);

  $scope.$watchCollection("selection", function (selection) {
    var item = selection.item;
    var items = selection.items;

    $scope.multiSelection = Boolean(items);
    $scope.hasSelection = Boolean(item);

    console.log(selection);

    if (!item && !items) {
      $state.go("cephPools");
      return;
    }

    if (item) {
      $state.go("cephPools.detail.status", {
        cephPool: item.id,
        "#": "more"
      });
    }
  });
});
