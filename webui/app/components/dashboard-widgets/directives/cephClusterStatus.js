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
app.directive("cephClusterStatus", function () {
  return {
    restrict   : "E",
    scope      : true,
    controller : function ($scope, $interval, cephClusterService) {
      var promise;
      $scope.data = {};
      $scope.isLoading = false;
      $scope.warnCollapsed = true;
      $scope.errCollapsed = true;

      // Functions
      var init = function () {
        $scope.getData();
        $scope.startInterval();
      };

      $scope.getData = function () {
        $scope.isLoading = true;
        cephClusterService
            .get()
            .$promise
            .then(function (res) {
              $scope.processData(res);
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

      $scope.processData = function (data) {
        $scope.data = {
          "count"  : 0,
          "ok"     : [],
          "warn"   : [],
          "err"    : [],
          "unknown": []
        };
        $scope.data.count = data.count;
        angular.forEach(data.results, function (element) {
          switch (element.health) {
            case "HEALTH_OK":
              $scope.data.ok.push(element);
              break;
            case "HEALTH_WARN":
              $scope.data.warn.push(element);
              break;
            case "HEALTH_ERR":
              $scope.data.err.push(element);
              break;

            default:
              $scope.data.unknown.push(element);
              break;
          }
        });

        if ($scope.data.warn.length > 0 || $scope.data.err.length > 0) {
          angular.forEach($scope.data.warn.concat($scope.data.err), function (cluster) {
            cephClusterService
                .status({fsid: cluster.fsid})
                .$promise
                .then(function (res) {
                  cluster.summary = res.health.summary;
                })
                .catch(function (error) {
                  throw error;
                });
          });
        }
      };

      $scope.startInterval = function () {
        // stops any running interval to avoid two intervals running at the same time
        $scope.stopInterval();

        // store the interval promise
        promise = $interval(function () {
          $scope.getData();
        }, 5000, false);
      };

      $scope.stopInterval = function () {
        $interval.cancel(promise);
      };

      // Event-Handler
      $scope.$on("$destroy", function () {
        $scope.stopInterval();
      });

      // init
      init();
    },
    templateUrl: "components/dashboard-widgets/templates/ceph-cluster-status.html"
  };
});