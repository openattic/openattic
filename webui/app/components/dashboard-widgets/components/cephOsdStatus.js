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

var app = angular.module("openattic.dashboardWidgets");
app.component("cephOsdStatus", {
  templateUrl: "components/dashboard-widgets/templates/ceph-osd-status.html",
  bindings: {
    settings: "="
  },
  controller: function ($scope, $interval, cephClusterService) {
    var promise;
    this.isLoading = false;
    this.cluster = [];
    var self = this;

    this.isAnyAlertShown = function () {
      if (!self.cluster.osdmap || !self.nvd3api) {
        return false;
      }
      var osdmap = self.cluster.osdmap.osdmap;
      var reason = osdmap.nearfull || osdmap.full;
      if (reason) {
        self.nvd3api.update();
      }
      return reason;
    };

    this.createOsdPieChart = function () {
      var cluster = self.cluster;
      var osdmap = cluster.osdmap.osdmap;
      //var balanced = osdmap.num_up_osds === osdmap.num_in_osds; // use in future
      var unhealthy = osdmap.num_osds - osdmap.num_up_osds;
      var healthy = osdmap.num_up_osds;
      cluster.pieChart = {
        options: {
          chart: {
            type: "pieChart",
            showLabels: false,
            x: function (osdState) {
              return osdState.name;
            },
            y: function (osdState) {
              return osdState.value;
            },
            tooltip: {
              contentGenerator: self.nvd3Tooltip
            },
            color: self.nvd3Colorize,
            growOnHover: false,
            donut: true,
            showLegend: false,
            title: unhealthy || healthy,
            margin: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0
            }
          },
          styles: {
            classes: {
              okState: healthy && !unhealthy,
              errorState: unhealthy > 0
            }
          }
        },
        data: [
          {
            name: "Online",
            description: "up",
            value: healthy
          },
          {
            name: "Offline",
            description: "down",
            value: unhealthy
          }
        ]
      };
    };

    this.nvd3Tooltip = function (e) {
      var value = e.data.value;
      var message = [
        value,
        "OSD" + (value !== 1 ? "s" : ""),
        e.data.name
      ].join(" ");
      var header = [
        "<table><thead><tr>",
        "<td class='legend-color-guide'>",
        "<div style='background-color: " + e.series[0].color + ";'>",
        "</div></td>",
        "<td class='key'>" + message + "</td>",
        "</tr></thead></table>"
      ].join("");
      return header;
    };

    this.nvd3Colorize = function (osdState) {
      var success = "#5cb85c";
      var danger = "#d9534f";
      return osdState.name === "Online" ? success : danger;
    };

    this.startInterval = function () {
      // stops any running interval to avoid two intervals running at the same time
      self.stopInterval();

      // Get data before the first interval is executed
      self.updateClusterInformation();

      // store the interval promise
      promise = $interval(function () {
        self.updateClusterInformation();
      }, 20000, false);
    };

    this.stopInterval = function () {
      $interval.cancel(promise);
    };

    this.updateClusterInformation = function () {
      self.isLoading = true;
      cephClusterService
        .status({
          fsid: self.settings.cluster.fsid
        })
        .$promise
        .then(function (cluster) {
          self.cluster = cluster;
          self.createOsdPieChart();
        })
        .finally(function () {
          $interval(function () {
            self.isLoading = false;
          }, 1000, 1);
        });
    };

    // Watcher
    $scope.$watch("widget.settings", function (newValue, oldValue) {
      if (angular.equals(newValue, oldValue)) {
        return;
      }
      self.updateClusterInformation();
    });

    // Event-Handler
    $scope.$on("$destroy", function () {
      self.stopInterval();
    });

    $scope.$on("gridster-resized", function () {
      self.nvd3api.update();
    });

    $scope.$on("gridster-item-transition-end", function () {
      self.nvd3api.update();
    });

    this.startInterval();
  }
});
