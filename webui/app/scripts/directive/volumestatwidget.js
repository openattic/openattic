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
app.directive("volumestatwidget", function () {
  return {
    restrict: "A",
    scope: true,
    replace: true,
    templateUrl: "templates/volumes/statwidget.html",
    controller: function ($scope, VolumeService) {
      $scope.volumes = [];
      $scope.volumesLoaded = false;
      $scope.selectedVolume = null;

      $scope.dashboardparams = {
        profile: null
      };

      VolumeService.query()
      .$promise
      .then(function (res) {
        $scope.volumesLoaded = true;
        for (var i = 0; i < res.length; i++) {
          if (res[i].status.status !== "good" && res[i].status.status !== "locked") {
            $scope.volumes.push(res[i]);
          }
        }
      })
      .catch(function (error) {
        console.log("An error occurred", error);
      });

      $scope.volumeStatusMsg = function (volume) {
        var msgs = [];
        if (volume.status.flags.nearfull) {
          msgs.push(volume.status.flags.nearfull);
        }
        if (volume.status.flags.highload) {
          msgs.push(volume.status.flags.highload);
        }
        if (volume.status.flags.highlatency) {
          msgs.push(volume.status.flags.highlatency);
        }
        if (volume.status.flags.randomio) {
          msgs.push(volume.status.flags.randomio);
        }
        return msgs.join(" ");
      };

      $scope.select = function (volume) {
        $scope.selectedVolume = volume;
        if (volume.status.flags.nearfull) {
          $scope.graphTitle = "Volume Space";
        } else if (volume.status.flags.highload) {
          $scope.graphTitle = "Disk Load";
        } else if (volume.status.flags.highlatency) {
          $scope.graphTitle = "Average Latency (r/w)";
        } else if (volume.status.flags.randomio) {
          $scope.graphTitle = "Average Request Size (r/w)";
        }
      };
    }
  };
});