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

var helpers = require("../../common.js");
var CephPoolCommon = require("./cephPoolCommon.js");

describe("should test the ceph pools panel", function () {
  var cephPoolProperties = new CephPoolCommon();

  beforeAll(function () {
    helpers.login();
    cephPoolProperties.cephPools.click();
  });

  it("should check the ceph pool url", function () {
    helpers.checkLocation("ceph/pools");
  });

  it("should display the ceph pools table", function () {
    expect(element(by.css(".tc_cephPoolTable")).isDisplayed()).toBe(true);
  });

  it("should have an add button", function () {
    expect(cephPoolProperties.addButton.isDisplayed()).toBe(true);
  });

  cephPoolProperties.tableHeaders.forEach(function (header) {
    it("should " + !header.displayed ? "not " : "" + "display the following table header: " + header.name, function () {
      expect(element(by.cssContainingText("th", header.name)).isDisplayed()).toBe(header.displayed);
    });
  });

  it("should have at least one ceph pools table entry", function () {
    expect(element.all(by.binding("row.name")).count()).toBeGreaterThan(0);
  });

  it("should have a details tab when selecting a pool", function () {
    //choose first element in ceph pools list
    element.all(by.css("tbody > tr > td > input")).get(0).click();

    helpers.checkLocation("ceph/pools/details#more");
    expect(cephPoolProperties.detailsTab.isDisplayed()).toBe(true);
  });

  cephPoolProperties.detailAttributes.forEach(function (attr) {
    it('should check the content attribute "' + attr.name + '" in the details tab when selecting a pool', function () {
      expect(element.all(by.cssContainingText("dt", attr.name + ":")).first().isDisplayed()).toBe(attr.displayed);
    });
  });

  it("should have a statistic tab when selecting a pool", function () {
    cephPoolProperties.statisticsTab.click();
    helpers.checkLocation("ceph/pools/statistics#more");
    expect(cephPoolProperties.statisticsTab.isDisplayed()).toBe(true);
    element.all(by.css("tbody > tr > td > input")).get(0).click();
  });

  var cephCluster = helpers.configs.cephCluster;
  var cephClusterCount = Object.keys(cephCluster).length;
  Object.keys(cephCluster).forEach(function (clusterName) {
    var cluster = cephCluster[clusterName];
    Object.keys(cluster.pools).forEach(function (poolName) {
      var pool = cluster.pools[poolName];
      it('should have the configured pool "' + pool.name + '" in the pool list of cluster "' + cluster.name + '"',
        function () {
          if (cephClusterCount > 1) {
            var clusterSelect = element(by.model("$ctrl.registry.selectedCluster"));
            clusterSelect.sendKeys(cluster.name);
            browser.sleep(800);
            expect(clusterSelect.getText()).toContain(cluster.name);
          }
          expect(helpers.search_for_element(pool.name).isDisplayed()).toBe(true);
        });
    });
  });

  /*
  Only if cache tiering is available by the pool. Can't be tested yet.

  it('should have a cache tiering tab when selecting a pool', function(){
    expect(cacheTieringTab.isDisplayed()).toBe(true);
    cacheTieringTab.click();
    browser.sleep(400);
    //check for tab content
    expect(element(by.cssContainingText('dt', 'tier_of:')).isDisplayed()).toBe(true);
    expect(element(by.cssContainingText('dt', 'target_max_bytes:')).isDisplayed()).toBe(true);
  });
  */

  afterAll(function () {
    console.log("ceph_pools -> ceph_pools.e2e.js");
  });
});
