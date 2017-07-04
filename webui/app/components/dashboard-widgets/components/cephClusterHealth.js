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

var app = angular.module("openattic.dashboardWidgets");
app.component("cephHealth", {
  templateUrl: "components/dashboard-widgets/templates/ceph-cluster-health.html",
  controller: function ($scope, $interval, cephClusterService) {
    var self = this;
    var promise;
    self.data = {};
    self.isLoading = false;
    self.summaryCollapsed = true;
    self.messages = {
      ok: undefined,
      warn: undefined,
      err: undefined,
      unknown: undefined
    };

    self.init = function () {
      self.getData();
      self.startInterval();
    };

    self.getData = function () {
      self.isLoading = true;
      cephClusterService
          .get()
          .$promise
          .then(function (res) {
            self.processData(res);
            self.processSummaries();
            self.processMessages();
          })
          .finally(function () {
            $interval(function () {
              self.isLoading = false;
            }, 1000, 1);
          });
    };

    self.processData = function (data) {
      angular.extend(data, {
        ok: [],
        warn: [],
        err: [],
        unknown: []
      });
      angular.forEach(data.results, function (element) {
        switch (element.health) {
          case "HEALTH_OK":
            data.ok.push(element);
            break;
          case "HEALTH_WARN":
            data.warn.push(element);
            break;
          case "HEALTH_ERR":
            data.err.push(element);
            break;
          default:
            data.unknown.push(element);
            break;
        }
      });
      self.data = data;
    };

    self.processSummaries = function () {
      var data = self.data;
      if (data.warn.length > 0 || data.err.length > 0) {
        angular.forEach(data.warn.concat(data.err), function (cluster) {
          cephClusterService
              .status({fsid: cluster.fsid})
              .$promise
              .then(function (res) {
                var summaries = res.health.summary;
                cluster.summary = {
                  warn: self.filterSummary(summaries, "HEALTH_WARN"),
                  err: self.filterSummary(summaries, "HEALTH_ERR")
                };
                self.processMessages();
              });
        });
      }
    };

    self.filterSummary = function (summaries, severity) {
      return summaries.filter(function (summary) {
        return summary.severity === severity;
      });
    };

    self.processMessages = function () {
      angular.forEach(self.data, function (clusters, attribute) {
        if (angular.isArray(clusters)) {
          self.messages[attribute] = self.clusterMessage(attribute);
        }
      });
    };

    self.clusterMessage = function (attribute) {
      var data = self.data[attribute];
      var count = data.length;
      if (count === 0) {
        return;
      }
      var counting = self.getCountErrosAndWarnings(attribute);
      var messages = { //Cluster "xyz" is + the following text - or - x clusters are + the following text
        ok: "up and running",
        warn: "not operating correctly with ",
        err: "operating with ",
        unknown: "in an unknown error state"
      };
      var msg = [
          count > 1 ? count + " clusters are" : "Cluster \"" + data[0].name + "\" is",
          messages[attribute]
        ].join(" ");
      if (attribute === "err") {
        msg += [
          counting.err === 1 ? "an error" : counting.err + " errors",
          counting.warn > 0 ? "and " : ""
        ].join(" ");
      }
      if (["err", "warn"].indexOf(attribute) !== -1) {
        msg += counting.warn === 1 ? "a warning" : counting.warn + " warnings";
      }
      return msg;
    };

    self.getCountErrosAndWarnings = function (attribute) {
      if (["err", "warn"].indexOf(attribute) === -1) {
        return {};
      }
      var clusters = self.data[attribute];
      var counting = {
        warn: 0,
        err: 0
      };
      angular.forEach(clusters, function (cluster) {
        if (cluster.summary) {
          counting.warn += cluster.summary.warn.length;
          counting.err += cluster.summary.err.length;
        }
      });
      return counting;
    };

    self.startInterval = function () {
      // stops any running interval to avoid two intervals running at the same time
      self.stopInterval();
      promise = $interval(function () {
        self.getData();
      }, 500000, false); // for testing only
    };

    self.stopInterval = function () {
      $interval.cancel(promise);
    };

    // Event-Handler
    $scope.$on("$destroy", function () {
      self.stopInterval();
    });

    // init
    self.init();
  }
});
