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

var app = angular.module("openattic.dashboardWidgets");
app.directive("cephClusterPerformance", function () {
  return {
    restrict   : "E",
    scope      : true,
    controller : function ($scope, $interval, cephClusterService, cephPerfDataOpt) {
      var promise;
      $scope.isLoading = false;
      $scope.perfData = cephPerfDataOpt;
      $scope.graph = {
        config: {
          deepWatchDataDepth: 0
        },
        data: [],
        options: {
          chart: {
            color: ["#288cea", "#6430ec", "#ffdb1b", "#ffa21b", "#19f13f", "#ff2b1b"],
            forceY: [0],
            interpolate: "linear",
            legend: {
              vers: "furious",
              margin: {
                top: 3,
                right: 0,
                bottom: 10,
                left: -64
              },
              rightAlign: false
            },
            legendPosition: "top",
            margin: {
              top: 0,
              right: 0,
              bottom: 40,
              left: 80
            },
            type: "lineChart",
            useInteractiveGuideline: true,
            x: function (d) {
              return d[0];
            },
            xAxis: {
              axisLabel: "Time",
              fontSize: 11,
              showMaxMin: false,
              tickFormat: function (d) {
                return d3.time.format("%d.%m %H:%M")(new Date(d * 1000));
              }
            },
            y: function (d) {
              if (d[1] === null) {
                d[1] = 0;
              }
              return d[1];
            },
            yAxis: {
              axisLabel: $scope.widget.settings.perfdata,
              axisLabelDistance: 20,
              fontSize: 11,
              tickFormat: function (d) {
                var v = formatBytes(d, 2);
                return v[0] + v[1];
              }
            }
          }
        }
      };

      // Functions
      var init = function () {
        $scope.startInterval();
      };

      var formatBytes = function (bytes, decimals) {
        if (bytes === null || bytes === 0) {
          return [0, "B", 1, "B", 0];
        }

        var units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
        var factor = 1024;
        var dm = decimals || 2;

        var i = Math.floor(Math.log(bytes) / Math.log(factor));
        var k = i;
        var value = parseFloat((bytes / Math.pow(factor, i)).toFixed(dm));
        var round = 0;

        if (value < 100) {
          round = Math.ceil(value / 10) * 10;
        } else if (value < 1000) {
          round = Math.ceil(value / 100) * 100;
        } else {
          k++;
          round = 2;
        }

        return [value, units[i], i, round, units[k], k, factor];
      };

      $scope.getData = function () {
        var filter = null;
        $scope.isLoading = true;

        switch ($scope.widget.settings.perfdata) {
          case $scope.perfData[0]:
            filter = "read_bytes_sec,write_bytes_sec";
            break;
          case $scope.perfData[1]:
            $scope.graph.options.chart.margin.left = 50;
            $scope.graph.options.chart.legend.margin.left = -34;
            $scope.graph.options.chart.yAxis.axisLabelDistance = -10;
            $scope.graph.options.chart.yAxis.tickFormat = function (d) {
              return d;
            };
            filter = "num_osds,num_up_osds";
            break;
          case $scope.perfData[2]:
            filter = "bytes_total,bytes_avail,bytes_used";
            break;

          default:
            filter = "read_bytes_sec,write_bytes_sec";
            break;
        }

        cephClusterService
            .performancedata({
              fsid  : $scope.widget.settings.cluster.fsid,
              filter: filter
            })
            .$promise
            .then(function (res) {
              // Clear old data
              $scope.graph.data = [];

              angular.forEach(res, function (e) {
                // Filter null TODO remove if fixed in BE
                var len = e.values.length;
                if (e.values[len - 2][1] === null) {
                  e.values.splice(len - 2, 2);
                } else {
                  e.values.splice(len - 1, 1);
                }

                // Customize graphs
                switch (e.key) {
                  case "read_bytes_sec":
                    e.key = "Read";
                    break;
                  case "write_bytes_sec":
                    e.key = "Write";
                    break;
                  case "num_osds":
                    e.key = "OSDs";
                    e.area = true;
                    break;
                  case "num_up_osds":
                    e.key = "Online OSDs";
                    break;
                  case "bytes_total":
                    e.key = "Bytes total";
                    e.area = true;
                    break;
                  case "bytes_avail":
                    e.key = "Bytes available";
                    break;
                  case "bytes_used":
                    e.key = "Bytes used";
                    break;

                  default:
                    e.key = "undefined key";
                    break;
                }

                // Save new data
                $scope.graph.data.push(e);
              });
            })
            .catch(function (error) {
              throw error;
            })
            .finally(function () {
              $interval(function () {
                $scope.isLoading = false;
              }, 1000, 1);
            });
      };

      $scope.startInterval = function () {
        // stops any running interval to avoid two intervals running at the same time
        $scope.stopInterval();

        // Get data before the first interval is executed
        $scope.getData();

        // store the interval promise
        promise = $interval(function () {
          $scope.getData();
        }, 60000, false);
      };

      $scope.stopInterval = function () {
        $interval.cancel(promise);
      };

      // Watcher
      $scope.$watch("widget.settings", function (newValue, oldValue) {
        if (angular.equals(newValue, oldValue)) {
          return;
        }

        $scope.getData();
      });

      // Event-Handler
      $scope.$on("$destroy", function () {
        $scope.stopInterval();
      });

      $scope.$on("gridster-resized", function () {
        $scope.graph.api.update();
      });

      $scope.$on("gridster-item-transition-end", function () {
        $scope.graph.api.update();
      });

      // init
      init();
    },
    templateUrl: "components/dashboard-widgets/templates/ceph-cluster-performance.html"
  };
});