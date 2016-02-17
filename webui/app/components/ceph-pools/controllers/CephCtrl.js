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
app.controller("CephPoolsCtrl", function ($scope, Paginator) {
  $scope.data = {};
  $scope.data = {
    "update_time": "2016-02-17T09:18:41.418724+00:00",
    "id": "b53a6c7a-6d99-4a48-a4f9-bf35945eae75",
    "name": "ceph",
    "pool": [
      {
        "full": false,
        "name": "rbd",
        "quota_max_objects": 0,
        "hashpspool": true,
        "min_size": 1,
        "crash_replay_interval": 0,
        "pg_num": 128,
        "pgp_num": 128,
        "quota_max_bytes": 0,
        "size": 2,
        "id": 0,
        "crush_ruleset": 0
      },
      {
        "full": false,
        "name": "testpool",
        "quota_max_objects": 0,
        "hashpspool": true,
        "min_size": 1,
        "crash_replay_interval": 0,
        "pg_num": 512,
        "pgp_num": 512,
        "quota_max_bytes": 0,
        "size": 2,
        "id": 1,
        "crush_ruleset": 0
      }
    ],
    count: 2
  };

  $scope.filterConfig = {
    page: 0,
    entries: 100,
    search: "",
    sortfield: null,
    sortorder: null
  };

  $scope.selection = {
  };

  /*
  $scope.$watch("filterConfig", function () {
    Paginator
      .filter({
        page: $scope.filterConfig.page + 1,
        pageSize: $scope.filterConfig.entries,
        search: $scope.filterConfig.search,
        ordering: ($scope.filterConfig.sortorder === "ASC" ? "" : "-") + $scope.filterConfig.sortfield,
        upper__isnull: "True"
      })
      .$promise
      .then(function (res) {
        $scope.data = res;
      })
      .catch(function (error) {
        console.log("An error occurred", error);
      });
  }, true);
  */

  $scope.$watchCollection("selection", function (selection) {
    var item = selection.item;
    var items = selection.items;

    $scope.multiSelection = Boolean(items);
    $scope.hasSelection = Boolean(item);
  });

});
