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
        lun: {
          btn: "LUN",
          desc: "iSCSI, Fibre Channel shares and volume mirroring"
        },
        xfs: {
          btn: "XFS",
          desc: "recommended for virtualization, optimized for parallel IO"
        },
        zfs: {
          btn: "ZFS",
          desc: "supports snapshots, deduplication and compression"
        },
        btrfs: {
          btn: "Btrfs",
          desc: "supports snapshots, compression - Experimental"
        },
        ext4: {
          btn: "ext4",
          desc: "max. 1 EiB - Linux default"
        },
        ext3: {
          btn: "ext3",
          desc: "max. 32TiB - old Linux default since 2010"
        },
        ext2: {
          btn: "ext2",
          desc: "deprecated"
        }
      };

      $scope.fsStatic = ["lun", "xfs", "zfs", "btrfs", "ext4", "ext3", "ext2"];

      if ($scope.availTypes) {
        for (var key in $scope.filesystems) {
          if ($scope.availTypes.indexOf(key) === -1) {
            delete $scope.filesystems[key];
            $scope.fsStatic.splice($scope.fsStatic.indexOf(key), 1);
          }
        }
      }

      $scope.$watch("pool", function (pool) {
        if (pool) {
          $scope.poolValidation.$setValidity("usablesize", pool.usage.free >= 100);
          $scope.fsArray = $scope.fsStatic.slice();

          new PoolService(pool).$filesystems()
            .then(function (res) {
              res.lun = "Sth";
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
