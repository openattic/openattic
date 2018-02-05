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

let cephNodesListPage = function () {
  this.menu = element(by.css(".tc_menuitem_ceph_nodes"));
  this.table = element(by.css(".tc_cephNodesTable"));

  this.thHostname = element(by.cssContainingText("th", "Hostname"));
  this.thAddresses = element(by.cssContainingText("th", "Addresses"));
  this.thCluster = element(by.cssContainingText("th", "Cluster"));
  this.thRoles = element(by.cssContainingText("th", "Roles"));
  this.thKeyStatus = element(by.cssContainingText("th", "Key status"));

  this.allTDs = element.all(by.css("td"));

  this.detailsTab = element(by.css(".tc_detailsTab"));
  this.details = element(by.css(".tc_details"));

  this.statisticsTab = element(by.css(".tc_statisticsTab"));
  this.statistics = element(by.css(".grafana"));

  this.dtAddresses = element(by.cssContainingText("dt", "Addresses:"));
  this.dtCluster = element(by.cssContainingText("dt", "Cluster:"));
  this.dtKeystatus = element(by.cssContainingText("dt", "Key status:"));
  this.dtOSDs = element(by.cssContainingText("dt", "OSDs:"));
  this.dtRoles = element(by.cssContainingText("dt", "Roles:"));
};

module.exports = cephNodesListPage;
