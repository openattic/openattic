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
app.controller("CephPoolsStatisticsCtrl", function ($scope, $interval, cephPoolsService, graphConfigService,
    graphOptionsService) {
  var promise;
  var map = {};
  var refreshInterval = 5000;
  $scope.isLoading = false;

  $scope.data = [];
  $scope.utilization = {
    api: {},
    config: angular.copy(graphConfigService),
    data: [],
    options: angular.copy(graphOptionsService)
  };
  $scope.noo = {
    api: {},
    config: angular.copy(graphConfigService),
    data: [],
    options: angular.copy(graphOptionsService)
  };

  $scope.utilization.options.chart.yAxis.axisLabel = "Bytes per sec";
  $scope.noo.options.chart.yAxis.axisLabel = "Number of objects";

  // Functions
  var init = function () {
    $scope.getData();
    $scope.startInterval();
  };

  $scope.getData = function () {
    if (!angular.isDefined($scope.selection.item)) {
      return;
    }

    $scope.isLoading = true;
    cephPoolsService
        .performancedata({
          fsid: $scope.selection.item.cluster,
          filter_pools: $scope.selection.item.name
        })
        .$promise
        .then(function (res) {
          angular.forEach(res[$scope.selection.item.name], function (value) {
            $scope.data[value.key] = value;
          });

          // First call
          if (angular.equals($scope.utilization.data, []) && angular.equals($scope.noo.data, [])) {
            map.max_avail = $scope.utilization.data.push($scope.data.max_avail);
            map.num_bytes = $scope.utilization.data.push($scope.data.num_bytes);
            map.num_objects = $scope.noo.data.push($scope.data.num_objects);

            angular.forEach(map, function (element, key) {
              map[key] = element - 1;
            });
          } else {
            $scope.utilization.data[map.max_avail].values = $scope.data.max_avail.values;
            $scope.utilization.data[map.num_bytes].values = $scope.data.num_bytes.values;
            $scope.noo.data[map.num_objects].values = $scope.data.num_objects.values;
          }

          $scope.update();
        })
        .catch(function (err) {
          throw err;
        })
        .finally(function () {
          $interval(function () {
            $scope.isLoading = false;
          }, 1000, 1);
        });
  };

  $scope.update = function () {
    $scope.utilization.api.update();
    $scope.noo.api.update();
  };

  $scope.startInterval = function () {
    // stops any running interval to avoid two intervals running at the same time
    $scope.stopInterval();

    // store the interval promise
    promise = $interval(function () {
      $scope.getData();
    }, refreshInterval, false);
  };

  $scope.stopInterval = function () {
    $interval.cancel(promise);
  };

  // Watcher
  $scope.$watch("selection.item", function () {
    $scope.getData();
  });

  // Event-Handler
  $scope.$on("$destroy", function () {
    $scope.stopInterval();
  });

  // init
  init();
});