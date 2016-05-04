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

var app = angular.module("openattic");
app.directive("poolFsSupport", function () {
  return {
    restrict: "E",
    scope: {
      filesystem: "=",
      pool: "=",
      wizzard: "=",
      poolValidation: "="
    },
    templateUrl: "templates/poolTypes.html",
    controller: function ($scope, PoolService) {
      $scope.supported_filesystems = {};
      $scope.state = {formatted: false};

      $scope.filesystems = {
        lun: "Create LUN",
        xfs: "Create Virtualization Store -> XFS",
        zfs: "Create ZFS Volume",
        btrfs: "Create File Store -> BTRFS",
        ext4: "Create EXT4",
        ext3: "Create EXT3",
        ext2: "Create EXT2"
      };

      $scope.$watch("pool", function (pool) {
        if (pool) {
          $scope.poolValidation.$setValidity("usablesize", pool.usage.free >= 100);

          new PoolService(pool).$filesystems()
            .then(function (res) {
              for (var index in res) {
                if (res.hasOwnProperty(index) && typeof (res[index]) === "string") {
                  res[index] = res[index].match(/\((.*)\)/)[1];
                }
              }
              $scope.filesystem = "lun";
              res.lun = "can be shared via iSCSI or Fibre Channel";
              $scope.supported_filesystems = res;
            }, function (error) {
              console.log("An error occured", error);
            });
        } else {
          if ($scope.poolValidation) {
            $scope.poolValidation.$setValidity("usablesize", true);
          }
        }
      });
    }
  };
});
