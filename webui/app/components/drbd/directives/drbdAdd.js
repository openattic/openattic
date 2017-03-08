/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 SUSE LLC
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

var app = angular.module("openattic.drbd");
app.directive("drbdAdd", function () {
  return {
    restrict: "E",
    scope: {
      validation: "=",
      result: "=",
      wizard: "="
    },
    templateUrl: "components/drbd/templates/drbd-add.html",
    controller: function ($scope, poolsService) {
      // Default values.
      $scope.data = {
        remote_pool: null,
        remote_pool_waiting_msg: "-- Select a pool --",
        remote_pools: []
      };

      /**
       * Listen to Pool selections. Reload and filter the remote pool list
       * if a pool has been selected.
       */
      $scope.$watch("result.source_pool", function (pool) {
        if (!pool) {
          // Reset list of available remote pools.
          $scope.data.remote_pools = [];
          return;
        }
        $scope.data.remote_pool_waiting_msg = "Retrieving pool list...";
        poolsService.query({ excl_host: pool.host })
          .$promise
          .then(function (res) {
            $scope.data.remote_pools = res;
            $scope.data.remote_pool_waiting_msg = "-- Select a pool --";
          }, function () {
            $scope.data.remote_pool_waiting_msg = "Error: List couldn't be loaded!";
            $scope.validation.remote_pool.$setValidity("loading", false);
          });
      });

      /**
       * Ensure that the remote pool is large enough to hold the
       * requested volume.
       */
      $scope.validatePoolSize = function () {
        var valid = true;
        if ($scope.data.remote_pool && $scope.result.megs) {
          valid = $scope.data.remote_pool.usage.free > $scope.result.megs;
        }
        $scope.validation.remote_pool.$setValidity("poolSize", valid);
        return valid;
      };
      $scope.$watch("result.megs", function () {
        $scope.validatePoolSize();
      });
      $scope.$watch("data.remote_pool", function () {
        // Validate the pool size.
        var valid = $scope.validatePoolSize();
        // If it is valid, then store the remote pool in the formular
        // submit values.
        if (valid && $scope.data.remote_pool) {
          $scope.result.remote_pool = {
            id: $scope.data.remote_pool.id,
            name: $scope.data.remote_pool.name,
            host: $scope.data.remote_pool.host.id
          };
        } else {
          delete $scope.result.remote_pool;
        }
      });
    }
  };
});
