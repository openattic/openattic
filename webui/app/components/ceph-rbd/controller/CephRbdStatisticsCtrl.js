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
app.controller("CephRbdStatisticsCtrl", function ($scope, cephRbdService) {
  /*
   * If the user selects another item, check if fast-diff is activated
   */
  $scope.$watch("selection.item", function () {
    $scope.fastDiff = $scope.selection.item && $scope.selection.item.features.indexOf("fast-diff") !== -1;
  });

  /*
   * Outlines the graphs that will be shown
   */
  $scope.config = {
    graphs: {
        used: {
          name: "Used",
          bindings: ["used_size"]
        },
        provisionedSize: {
          name: "Provisioned size",
          bindings: ["provisioned_size"]
        }
      },
    api: {
      call: cephRbdService.performancedata,
      filterApi: function (rbd) {
        return {
          fsid: rbd.pool.cluster,
          pool: rbd.pool.name,
          name: rbd.name
        };
      }
    }
  };

});
