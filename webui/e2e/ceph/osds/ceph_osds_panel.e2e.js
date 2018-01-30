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
var helpers = require("../../common.js");

describe("should test the ceph osd panel", function () {
  var cephOSDs = element(by.css(".tc_menuitem_ceph_osds"));

  beforeAll(function () {
    helpers.login();
    cephOSDs.click();
  });

  var tableHeaders = [
    "Name",
    "Hostname",
    "Status",
    "Storage Backend",
    "Crush Weight"
  ];

  it("should check the ceph OSDs url", function () {
    helpers.checkLocation("ceph/osds");
  });

  it("should display the ceph OSD table after selecting a cluster", function () {
    expect(element(by.css(".tc_cephOsdTable")).isDisplayed()).toBe(true);
  });

  it("should display the following table headers", function () {
    for (let tableHeader in tableHeaders) {
      expect(element(by.cssContainingText("th", tableHeaders[tableHeader])).isDisplayed()).toBe(true);
      //check: console.log(tableHeaders[tableHeader]);
    }
  });

  it("should have at least one ceph osd table entry", function () {
    expect(element.all(by.binding("row.name")).count()).toBeGreaterThan(0);
  });

  /* TODO: Update the tests to use the configuration
   it('should select a cluster', function(){
   selectCluster.click();
   });

  it('should still have the cluster selected and display OSDs when switching between panels', function(){
    element(by.css('ul .tc_menuitem_pools > a')).click();
    helpers.checkLocation('pools');
    cephMenu.click();
    cephOSDs.click();
    helpers.checkLocation('ceph/osds');
    expect(element(by.id('cluster-selection')).getText()).toContain('ceph (');
    expect(element.all(by.binding('row.name')).count()).toBeGreaterThan(0);
  });
  */

  afterAll(function () {
    console.log("ceph_osds -> ceph_osds_panel.e2e.js");
  });

});

