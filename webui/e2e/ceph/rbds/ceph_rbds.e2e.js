"use strict";

var helpers = require("../../common.js");
var RbdCommons = require("./cephRbdCommon.js");

describe("should test the ceph rbd panel", function () {
  var rbdProperties = new RbdCommons();

  beforeAll(function () {
    helpers.login();
    rbdProperties.cephRBDs.click();
  });

  rbdProperties.useWriteablePools((poolName) => {
    it("should create a rbd with default settings on " + poolName, function () {
      rbdProperties.selectPool(poolName);
      var rbdName = "e2e_" + poolName;
      rbdProperties.createRbd(rbdName);
    });
  });

  it("should check the ceph RBDs url", function () {
    helpers.checkLocation("ceph/rbds");
  });

  it("should display the ceph RBD table", () => {
    expect(element(by.css(".tc_cephRbdTable")).isDisplayed()).toBe(true);
  });

  rbdProperties.tableHeaders.forEach(function (header) {
    it("should " + !header.displayed ? "not " : "" + "display the following table header: " + header.name, function () {
      expect(element(by.cssContainingText("th", header.name)).isDisplayed()).toBe(header.displayed);
    });
  });

  it("should have at least one ceph rbd table entry", function () {
    expect(element.all(by.binding("row.name")).count()).toBeGreaterThan(0);
  });

  rbdProperties.detailAttributes.forEach(function (attribute) {
    it('should check the content attribute "' + attribute + '" in the details tab when selecting a rbd', function () {
      element.all(by.binding("row.name")).get(0).click();
      expect(element(by.cssContainingText("dt", attribute + ":")).isDisplayed()).toBe(true);
    });
  });

  rbdProperties.useWriteablePools((poolName) => {
    it("should have a statistic tab when selecting a rbd", function () {
      // Select the created rbd
      helpers.search_for_element("e2e_" + poolName).click();
      rbdProperties.statisticsTab.click();
      helpers.checkLocation("ceph/rbds/statistics#more");
      expect(rbdProperties.statisticsTab.isDisplayed()).toBe(true);
    });
  });

  rbdProperties.useWriteablePools((poolName) => {
    it("should delete the created rbd on " + poolName, function () {
      var rbdName = "e2e_" + poolName;
      helpers.search_for_element(rbdName).click();
      rbdProperties.deleteRbd(rbdName);
    });
  });

  afterAll(function () {
    console.log("ceph_rbds -> ceph_rbds.e2e.js");
  });

});

