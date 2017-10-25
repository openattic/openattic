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

import globalConfig from "globalConfig";

class Grafana {
  constructor ($window) {
    this.baseUrl = globalConfig.API.URL + "grafana/";
    this.dashboardName = "";
    this.src = "";
    this.urlParameterName = "";
    this.$window = $window;
  }

  /**
   * Set some information to determine the correct iframe source
   */
  $onInit () {
    /*
     * Check the given mode and set the correct dashboard name and url parameter name
     */
    switch (this.mode) {
      case "rbd":
        this.dashboardName = "ceph-rbd";
        this.urlParameterName = "var-image";
        break;
      case "pool":
        this.dashboardName = "ceph-pools";
        this.urlParameterName = "var-pool";
        break;
      case "osd":
        this.dashboardName = "ceph-osd";
        this.urlParameterName = "var-osd";
        break;
      case "node":
        this.dashboardName = "node-statistics";
        this.urlParameterName = "var-instance";
        break;
      case "rgwusers":
        this.dashboardName = "ceph-object-gateway-users";
        this.urlParameterName = "var-owner";
        break;
      default:
        this.dashboardName = "ceph-cluster";
        this.mode = "dashboard";
        break;
    }

    /*
     * Set src of the iframe.
     */
    if (this.mode === "dashboard") {
      this.src = this.baseUrl + "dashboard/db/" + this.dashboardName;
    } else {
      this.src = this.baseUrl + "dashboard/db/" + this.dashboardName + "?" + this.urlParameterName + "=" + this.data;
    }

    window.addEventListener("resize", () => {
      this.resize();
    });
  }

  $onChanges (values) {
    // Only update the source if binding "data" changes
    if (typeof values.data !== "undefined") {
      this.src = this.src.replace(values.data.previousValue, values.data.currentValue);
    }
  }

  /**
   * Resize the iframe in a certain period of time
   */
  resize () {
    // Use height of the main-view div, because that"s the div of the content
    var h = $(".grafana").contents().find(".main-view").height();
    $(".grafana").height(h);
  }
}

export default {
  template: require("./grafana.component.html"),
  bindings: {
    data: "<",
    mode: "<"
  },
  controller: Grafana
};
