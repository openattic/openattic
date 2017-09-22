"use strict";

var helpers = require("../../common.js");
var CephNfsManageService = require("./CephNfsManageService");

describe("ceph nfs", function () {

  var manageService = new CephNfsManageService();

  beforeAll(function () {
    helpers.login();
    element(by.css(".tc_menuitem_ceph_nfs")).click();
    manageService.startAllIfStopped();
  });

  it("should stop the NFS service", function () {
    manageService.manageServiceButton.click();
    manageService.stopServiceButton.get(0).click();
    manageService.waitForState(/.*Stopping*/, 0);
    expect(manageService.state.get(0).getText()).toMatch(/.*Stopped.*/);
    manageService.closeButton.click();
  });

  it("should start the NFS service", function () {
    manageService.manageServiceButton.click();
    manageService.startServiceButton.get(0).click();
    manageService.waitForState(/.*Starting*/, 0);
    expect(manageService.state.get(0).getText()).toMatch(/.*Running.*/);
    manageService.closeButton.click();
  });

  afterAll(function () {
    console.log("ceph_nfs -> ceph_nfs_manage_service.e2e.js");
  });

});
