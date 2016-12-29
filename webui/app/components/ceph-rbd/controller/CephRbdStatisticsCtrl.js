/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2016 SUSE LLC
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
app.controller("CephRbdStatisticsCtrl", function ($scope, $interval, cephRbdService, graphConfigService,
    graphOptionsService, toasty) {
  var interval;
  var refreshInterval = 60000; // 1min
  $scope.isLoading = false;

  /*
   * Outlines the graphs that will be shown
   */
  $scope.graphs = {
    exec_time: {
      name: "Execution time",
      desc: "",
      tickFormat: function (d) {
        return d + " ms";
      }
    },
    used_size: {
      name: "Used",
      desc: ""
    },
    provisioned_size: {
      name: "Provisioned size",
      desc: ""
    }
  };
  angular.forEach($scope.graphs, function (graph) {
    angular.extend(graph, {
      api: {},
      config: angular.copy(graphConfigService),
      data: [],
      options: angular.copy(graphOptionsService)
    });
    graph.options.chart.yAxis.axisLabel = graph.name;
  });

  /*
   * Initializes the graphs and the update interval.
   */
  var init = function () {
    $scope.getData();
    $scope.startInterval();
  };

  /*
   * Generates graph out of the API response.
   *
   * graph.data has to be an Array with key-values objects to be rendered in nv3d.
   *
   * The default tickformat will convert the values to a human readable file size.
   *
   * @param {Object} item - API response consists of a key and values.
   * @param {string} item.key - Name of the graph.
   * @param {number[][]} item.values - Monitored values.
   */
  $scope.setUpGraph = function (item) {
    if (!(item.key in $scope.graphs)) {
      return;
    }
    var graph = $scope.graphs[item.key];
    var chart = graph.options.chart;
    graph.data = [item];
    var domain = [
      d3.min(item.values)[0],
      d3.max(item.values)[0],
      0,
      d3.max(item.values.map(function (array) {
        return d3.max(array.slice(1));
      }))
    ];
    chart.xDomain = [domain[0], domain[1]];
    chart.yDomain = [domain[2], Math.ceil((domain[3] + 2) * 1.1)];
    if (angular.isFunction(graph.tickFormat)) {
      chart.yAxis.tickFormat = graph.tickFormat;
    }
  };

  /*
   * Triggers the API and calls with the right objects setUpGraph.
   */
  $scope.getData = function () {
    if (!angular.isDefined($scope.selection.item)) {
      return;
    }
    $scope.isLoading = true;
    var rbd = $scope.selection.item;
    cephRbdService
      .performancedata({
        id: rbd.pool.cluster,
        pool: rbd.pool.name,
        name: rbd.name
      })
      .$promise
      .then(function (res) {
        angular.forEach(res, function (item) {
          if (angular.isObject(item) && item.hasOwnProperty("key")) {
            $scope.setUpGraph(item);
          }
        });
        $scope.update();
      })
      .catch(function (err) {
        if ("detail" in err.data) {
          toasty.error({
            title: "Error " + err.status + " then loading RBD performance data",
            msg: err.data.detail
          });
        }
        throw err;
      })
      .finally(function () {
        $interval(function () {
          $scope.isLoading = false;
        }, 1000, 1);
      });
  };

  /*
   * Updates all graphs, with the nv3d update function.
   *
   * Each graph will get the API-functions passed by the nv3d-directive in the template.
   */
  $scope.update = function () {
    angular.forEach($scope.graphs, function (graph) {
      graph.api.update();
    });
  };

  /*
   * Starts or restarts the interval that refreshes the graphs.
   */
  $scope.startInterval = function () {
    $scope.stopInterval();
    interval = $interval(function () {
      $scope.getData();
    }, refreshInterval, false);
  };

  /*
   * Stops the interval.
   */
  $scope.stopInterval = function () {
    $interval.cancel(interval);
  };

  /*
   * Watches the selection for changes.
   * It will stop the interval if there is no selection and triggers the initialization if there is a selection.
   */
  $scope.$watch("selection.item", function (newValue) {
    if (newValue !== null) {
      init();
    } else {
      $scope.stopInterval();
    }
  });

  /*
   * Stops the interval if the scope is destroyed.
   * This happens if you click on another tab, list item or menu item,
   * but not if you deselect your selection.
   */
  $scope.$on("$destroy", function () {
    $scope.stopInterval();
  });
});
