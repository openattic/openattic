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
      wizard: "=",
      availTypes: "=",
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

      $scope.fsArray = ["lun", "xfs", "zfs", "btrfs", "ext4", "ext3", "ext2"];

      if ($scope.availTypes) {
        for (var key in $scope.filesystems) {
          if ($scope.availTypes.indexOf(key) === -1) {
            delete $scope.filesystems[key];
            $scope.fsArray.splice($scope.fsArray.indexOf(key), 1);
          }
        }
      }

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
              res.lun = "can be shared via iSCSI or Fibre Channel";
              $scope.supported_filesystems = res;
              var supportedFs = Object.keys(res);
              for (var key in $scope.filesystems) {
                if (supportedFs.indexOf(key) === -1) {
                  delete $scope.supported_filesystems[key];
                  var notAvail = $scope.fsArray.indexOf(key);
                  if (notAvail !== -1) {
                    $scope.fsArray.splice(notAvail, 1);
                  }
                }
              }
              if ($scope.fsArray.length > 0) {
                $scope.filesystem = $scope.fsArray[0];
              } else {
                $scope.filesystem = "";
              }
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
