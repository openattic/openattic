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

var app = angular.module("openattic.drbd");
app.directive("drbdAdd", function () {
  return {
    restrict: "E",
    scope: {
      validation: "=",
      volumeData: "=",
      wizard: "="
    },
    templateUrl: "components/drbd/templates/add-drbd.html",
    controller: function ($scope, poolsService, drbdService, toasty) {
      // Default values.
      $scope.data = {
        remote_pool: null,
        volume_mirroring: false,
        syncer_rate: "30M",
        protocol: "C"
      };
      $scope.remote_pool_waiting_msg = "-- Select a pool --";
      $scope.remote_pools = []

      // Listen to Pool selections. Reload and filter the remote pool list
      // if a pool has been selected.
      $scope.$watch("volumeData.source_pool", function (pool) {
        if (!pool)
          return;
        $scope.remote_pool_waiting_msg = "Retrieving pool list...";
        poolsService.query({ excl_host: pool.host })
          .$promise
          .then(function (res) {
            $scope.remote_pools = res;
            $scope.remote_pool_waiting_msg = "-- Select a pool --";
          }, function (error) {
            console.log("Failed to load the pool list.", error);
            toasty.error({
              title: "Pool list couldn't be loaded",
              msg: "Server failure."
            });
            $scope.remote_pool_waiting_msg = "Error: List couldn't be loaded!";
            $scope.validation.remote_pool.$setValidity("loading", false);
          })
      });

      // Ensure that the remote pool is large enough to hold the
      // requested volume.
      $scope.validatePoolSize = function () {
        var valid = true;
        if ($scope.data.remote_pool && $scope.volumeData.megs)
          valid = $scope.data.remote_pool.usage.free > $scope.volumeData.megs;
        $scope.validation.remote_pool.$setValidity("poolSize", valid);
      }
      $scope.$watch("volumeData.megs", function () {
        $scope.validatePoolSize();
      });
      $scope.$watch("data.remote_pool", function () {
        $scope.validatePoolSize();
      });

      // Listen to the event that is fired when a volume has been created.
      $scope.$on("volumecreate", function (event, volume) {
        // Abort immediatelly if volume mirroring is not enabled.
        if (!$scope.data.volume_mirroring)
          return;
        // Create the volume mirror.
        drbdService.save({
            source_volume: {
              id: volume.id,
              host: {
                id: volume.host.id
              }
            },
            remote_pool: {
              id: $scope.data.remote_pool.id,
              host: {
                id: $scope.data.remote_pool.host.id
              }
            },
            protocol: $scope.data.protocol,
            syncer_rate: $scope.data.syncer_rate,
            filesystem: $scope.volumeData.filesystem
          })
          .$promise
          .then(function (res) {
            toasty.success({
              title: "Volume Mirror",
              msg: "Successfully created the volume mirror."
            });
          }, function (error) {
            console.log("Failed to create the volume mirror.", error);
            toasty.error({
              title: "Volume Mirror",
              msg: "Failed to create the volume mirror."
            });
          });
      });
    }
  };
});
