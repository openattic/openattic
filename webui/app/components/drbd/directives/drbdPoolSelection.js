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

var app = angular.module("openattic");
app.directive("drbdPoolSelection", function () {
  return {
    restrict: "E",
    scope: {
      pool: "=",
      poolSize: "=",
      pools: "=",
      validation: "=",
      wizard: "="
    },
    templateUrl: "components/drbd/templates/pool-selection-drbd.html",
    controller: function ($scope) {
      $scope.validatePoolSize = function () {
        valid = true;
        if ($scope.pool && $scope.poolSize)
          valid = $scope.pool.usage.free > $scope.poolSize;
        $scope.validation.remote_pool.$setValidity("poolSize", valid);
      }

      // Default values.
      $scope.waitingMsg = "-- Select a pool --";

      // Ensure that the remote pool is large enough to hold the
      // requested volume.
      $scope.$watch("poolSize", function () {
        $scope.validatePoolSize();
      });
      $scope.$watch("pool", function () {
        $scope.validatePoolSize();
      });
    }
  };
});
