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

import _ from "lodash";

class DashboardComponent {
  constructor (cephClusterService) {
    this.cephClusterService = cephClusterService;

    this.promise = undefined;
    this.data = {};
    this.summaryCollapsed = true;
    this.messages = {
      ok: undefined,
      warn: undefined,
      err: undefined,
      unknown: undefined
    };
    this.isUpdating = false;
  }

  $onInit () {
    //Ceph Cluster Status
    this.getStatus();

    // stops any running interval to avoid two intervals running at the same time
    this.stopInterval();
    this.promise = setInterval(() => {
      this.isUpdating = true;
      this.getStatus();
    }, 60000);
  }

  $onDestroy () {
    this.stopInterval();
  }

  getStatus () {
    this.cephClusterService
      .get()
      .$promise
      .then((res) => {
        this.lastUpdateDate = new Date();
        this.processData(res);
        this.processSummaries();
        this.processMessages();
        this.isUpdating = false;
      });
  }

  processData (data) {
    Object.assign(data, {
      ok: [],
      warn: [],
      err: [],
      unknown: []
    });

    data.results.forEach((element) => {
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

    this.data = data;
  }

  processSummaries () {
    var data = this.data;
    if (data.warn.length > 0 || data.err.length > 0) {
      data.warn.concat(data.err).forEach((cluster) => {
        this.cephClusterService
          .status({ fsid: cluster.fsid })
          .$promise
          .then((res) => {
            // Convert object to array
            let summaries = Object.keys(res.health.checks).map((key) => {
              return res.health.checks[key];
            });

            cluster.summary = {
              warn: this.filterSummary(summaries, "HEALTH_WARN"),
              err: this.filterSummary(summaries, "HEALTH_ERR")
            };

            this.processMessages();
          });
      });
    }
  }

  filterSummary (summaries, severity) {
    return summaries.filter((summary) => {
      return summary.severity === severity;
    });
  }

  processMessages () {
    _.forIn(this.data, (clusters, attribute) => {
      if (Array.isArray(clusters)) {
        this.messages[attribute] = this.clusterMessage(attribute);
      }
    });
  }

  clusterMessage (attribute) {
    var data = this.data[attribute];
    var count = data.length;
    if (count === 0) {
      return;
    }
    var counting = this.getCountErrosAndWarnings(attribute);
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
  }

  getCountErrosAndWarnings (attribute) {
    if (["err", "warn"].indexOf(attribute) === -1) {
      return {};
    }
    var clusters = this.data[attribute];
    var counting = {
      warn: 0,
      err: 0
    };
    clusters.forEach((cluster) => {
      if (cluster.summary) {
        counting.warn += cluster.summary.warn.length;
        counting.err += cluster.summary.err.length;
      }
    });
    return counting;
  }

  stopInterval () {
    clearInterval(this.promise);
  }
}

export default {
  controller: DashboardComponent,
  template: require("./dashboard.component.html")
};
