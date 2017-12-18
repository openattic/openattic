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

var helpers = require("../../common.js");
var CephNodesListPage = require("./ceph-nodes-list.page.js");

describe("should test the ceph nodes page", () => {
  let page = new CephNodesListPage();

  beforeAll(() => {
    helpers.login();
    page.menu.click();
  });

  it("should check the Ceph Nodes url", () => {
    helpers.checkLocation("ceph/nodes");
  });

  it("should display the Ceph Nodes table after selecting a cluster", () => {
    expect(page.table.isDisplayed()).toBe(true);
  });

  it("should display the following table headers", () => {
    expect(page.thHostname.isDisplayed()).toBe(true);
    expect(page.thAddresses.isDisplayed()).toBe(true);
    expect(page.thCluster.isDisplayed()).toBe(true);
    expect(page.thRoles.isDisplayed()).toBe(true);
    expect(page.thKeyStatus.isDisplayed()).toBe(true);
  });

  it("should have at least one Ceph Nodes table entry", () => {
    expect(page.allTDs.count()).toBeGreaterThan(0);
  });

  it("should have a detail tab when selecting a node", () => {
    page.allTDs.first().click();
    page.detailsTab.click();
    helpers.checkLocation("ceph/nodes/details#more");
    expect(page.details.isDisplayed()).toBe(true);
  });

  it("should display the following node detail information", () => {
    expect(page.dtAddresses.isDisplayed()).toBe(true);
    expect(page.dtCluster.isDisplayed()).toBe(true);
    expect(page.dtKeystatus.isDisplayed()).toBe(true);
    expect(page.dtOSDs.isDisplayed()).toBe(true);
    expect(page.dtRoles.isDisplayed()).toBe(true);
  });

  it("should have a statistic tab", () => {
    page.statisticsTab.click();
    helpers.checkLocation("ceph/nodes/statistics#more");
    expect(page.statistics.isDisplayed()).toBe(true);
  });

  afterAll(() => {
    console.log("ceph_nodes -> ceph_nodes_list.e2e.js");
  });
});
