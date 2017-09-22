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
