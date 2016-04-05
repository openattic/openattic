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
app.controller("VolumeFormCtrl", function ($scope, $state, VolumeService, PoolService, SizeParserService, toasty) {
  $scope.volume = {};

  $scope.data = {
    sourcePool: null,
    megs: "",
    mirrorHost: "",
    mirrorPool: null,
    filesystem: ""
  };
  $scope.supported_filesystems = {};
  $scope.state = {
    created: false,
    mirrored: false,
    formatted: false
  };
  $scope.accordionOpen = {
    properties: true,
    mirror: false
  };
  $scope.selPoolUsedPercent = 0;

  PoolService.query()
      .$promise
      .then(function (res) {
        $scope.pools = res;
      }, function (error) {
        console.log("An error occurred", error);
      });

  $scope.$watch("data.sourcePool", function (sourcePool) {
    if (sourcePool) {
      $scope.volume.source_pool = { id: sourcePool.id };
      $scope.selPoolUsedPercent = parseFloat(sourcePool.usage.used_pcnt).toFixed(2);
      $scope.volumeForm.pool.$setValidity("usablesize", $scope.data.sourcePool.usage.free >= 100);

      new PoolService(sourcePool).$filesystems()
        .then(function (res) {
          $scope.supported_filesystems = res;
        }, function (error) {
          console.log("An error occured", error);
        });
    } else {
      if ($scope.volumeForm) {
        $scope.volumeForm.pool.$setValidity("usablesize", true);
      }
    }
  });
  $scope.$watch("data.megs", function (megs) {
    $scope.volume.megs = SizeParserService.parseInt(megs);
  });

  $scope.submitAction = function (volumeForm) {
    $scope.submitted = true;
    if (volumeForm.$valid) {
      if (!$scope.state.created) {
        if ($scope.data.filesystem !== "") {
          $scope.volume.filesystem = $scope.data.filesystem;
        }
        VolumeService.save($scope.volume)
            .$promise
            .then(function (res) {
              $scope.volume = res;
              $scope.state.created = true;
              $scope.state.formatted = $scope.volume.is_filesystemvolume;
              goToListView();
            }, function (error) {
              console.log("An error occured", error);
            });
      } else if (!$scope.state.mirrored && $scope.data.mirrorHost !== "") {
        toasty.warning({
          title: "Mirror Volume",
          msg: "Sorry, we haven\'t implemented that yet."
        });
      } else if (!$scope.state.formatted) {
        new VolumeService({
          id: $scope.volume.id,
          filesystem: $scope.data.filesystem
        }).$update()
          .then(function (res) {
            $scope.volume = res;
            $scope.state.formatted = true;
            goToListView();
          }, function (error) {
            console.log("An error occured", error);
          });
      }
    }
  };

  $scope.cancelAction = function () {
    goToListView();
  };

  var goToListView = function () {
    $state.go("volumes");
  };
});