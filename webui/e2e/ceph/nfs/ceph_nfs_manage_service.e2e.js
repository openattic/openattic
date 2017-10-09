"use strict";

const helpers = require("../../common.js");
const CephNfsManageService = require("./CephNfsManageService");

describe("ceph nfs", () => {

  let manageService = new CephNfsManageService();

  beforeAll(() => {
    helpers.login();
    helpers.setLocation("ceph/nfs");
    manageService.startAllIfStopped();
  });

  it("should stop the NFS service", () => {
    manageService.manageServiceButton.click();
    manageService.stopServiceButton.get(0).click();
    manageService.waitForState(/.*Stopping*/, 0);
    expect(manageService.state.get(0).getText()).toMatch(/.*Stopped.*/);
    manageService.closeButton.click();
  });

  it("should start the NFS service", () => {
    manageService.manageServiceButton.click();
    manageService.startServiceButton.get(0).click();
    manageService.waitForState(/.*Starting*/, 0);
    expect(manageService.state.get(0).getText()).toMatch(/.*Running.*/);
    manageService.closeButton.click();
  });

  afterAll(() => {
    console.log("ceph_nfs -> ceph_nfs_manage_service.e2e.js");
  });

});
