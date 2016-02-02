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

var app = angular.module("openattic.oaWizards");
app.controller("filestorage", function ($scope, PoolService) {
  var filestorageFSs = ["ZFS", "BTRFS", "Ext4", "Ext3"];

  $scope.input = {
    cifs: {
      create: false,
      available: true,
      browseable: true,
      writeable: true
    },
    nfs: {
      create: false,
      options: "rw,no_subtree_check,no_root_squash"
    }
  };
  $scope.selPoolUsedPercent = 0;

  PoolService.query()
      .$promise
      .then(function (res) {
        $scope.pools = res;
      }, function (error) {
        console.log("An error occurred", error);
      });

  $scope.$watch("input.volume.source_pool", function (sourcePool) {
    if (sourcePool) {
      $scope.selPoolUsedPercent = parseFloat(sourcePool.usage.used_pcnt).toFixed(2);
      $scope.contentForm1.source_pool.$setValidity("usablesize", $scope.input.volume.source_pool.usage.free >= 100);

      new PoolService(sourcePool)
          .$filesystems()
          .then(function (res) {
            var filesystems = [];
            for (var i in filestorageFSs) {
              if (filestorageFSs[i].toLowerCase() in res) {
                filesystems.push(filestorageFSs[i]);
              }
            }

            $scope.supported_filesystems = res;

            if (filesystems.length === 1) {
              $scope.supported_filesystems = filesystems[0];
            }

            $scope.input.volume.filesystem = filesystems[0].toLowerCase();
            $scope.filesystems_count = filesystems.length;
          }, function (error) {
            console.log("An error occured", error);
          });
    } else {
      $scope.filesystems_count = 0;
      $scope.supported_filesystems = "Choose a pool first";

      if ($scope.contentForm1) {
        $scope.contentForm1.source_pool.$setValidity("usablesize", true);
      }
    }
  });

  $scope.$watch("input.volume.name", function (volumename) {
    if (volumename) {
      $scope.input.cifs.name = volumename;
      $scope.input.cifs.path = "/media/" + volumename;
      $scope.input.nfs.path = "/media/" + volumename;
    }
  });
});