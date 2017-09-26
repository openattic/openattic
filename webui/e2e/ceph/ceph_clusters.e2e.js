"use strict";

var helpers = require("../common.js");

var cephOSDs = element(by.css(".tc_menuitem_ceph_osds"));
var configureClusterBtn = element(by.css(".tc_configureCluster"));

const resetFlags = () => {
  configureClusterBtn.click();
  element.all(by.css("ceph-cluster-settings-modal .ng-not-empty")).click();
  element(by.css(".tc_submitButton")).click();
};

describe("should test the ceph cluster settings modal", function () {
  beforeAll(function () {
    helpers.login();
    cephOSDs.click();
    resetFlags();
  });

  it('should show "Configure Cluster" button', function () {
    expect(configureClusterBtn.isDisplayed()).toBe(true);
  });

  it('should display the "Configure Cluster" modal', function () {
    configureClusterBtn.click();
    expect(element(by.css("ceph-cluster-settings-modal")).isDisplayed()).toBe(true);
  });

  it("should display the osd flags", function () {
    expect(element(by.css(".tc_noin")).isDisplayed()).toBe(true);
    expect(element(by.css(".tc_noout")).isDisplayed()).toBe(true);
    expect(element(by.css(".tc_noup")).isDisplayed()).toBe(true);
    expect(element(by.css(".tc_nodown")).isDisplayed()).toBe(true);
    expect(element(by.css(".tc_pause")).isDisplayed()).toBe(true);
    expect(element(by.css(".tc_noscrub")).isDisplayed()).toBe(true);
    expect(element(by.css(".tc_nodeep-scrub")).isDisplayed()).toBe(true);
    expect(element(by.css(".tc_nobackfill")).isDisplayed()).toBe(true);
    expect(element(by.css(".tc_norecover")).isDisplayed()).toBe(true);
  });

  it('should pick "No In" and submit the changes', function () {
    element(by.css(".tc_noin")).click();
    element(by.css(".tc_submitButton")).click();
    expect(element(by.css("ceph-cluster-settings-modal")).isPresent()).toBe(false);
  });

  it('should have "No In" enabled', function () {
    configureClusterBtn.click();
    expect(element(by.css("#noin.ng-not-empty")).isPresent()).toBe(true);
  });

  it('should disable "No In"', function () {
    element(by.css(".tc_noin")).click();
    element(by.css(".tc_submitButton")).click();
    expect(element(by.css("ceph-cluster-settings-modal")).isPresent()).toBe(false);
  });

  it('should have "No In" disabled', function () {
    configureClusterBtn.click();
    expect(element(by.css("#noin.ng-empty")).isPresent()).toBe(true);
  });

  afterAll(function () {
    console.log("ceph_clusters -> ceph_clusters.e2e.js");
  });

});

