"use strict";

const helpers = require("../../common.js");
const CephIscsiManageService = require("./CephIscsiManageService");

describe("ceph iscsi", () => {

  const manageService = new CephIscsiManageService();

  beforeAll(() => {
    helpers.login();
    helpers.setLocation("ceph/iscsi");
    manageService.startAllIfStopped();
  });

  it("should stop the iSCSI service", () => {
    manageService.manageServiceButton.click();
    manageService.stopServiceButton.get(0).click();
    manageService.waitForState(/.*Stopping*/, 0);
    expect(manageService.state.get(0).getText()).toMatch(/.*Stopped.*/);
    manageService.closeButton.click();
  });

  it("should start the iSCSI service", () => {
    manageService.manageServiceButton.click();
    manageService.startServiceButton.get(0).click();
    manageService.waitForState(/.*Starting*/, 0);
    expect(manageService.state.get(0).getText()).toMatch(/.*Running.*/);
    manageService.closeButton.click();
  });

  afterAll(() => {
    console.log("ceph_iscsi -> ceph_iscsi_manage_service.e2e.js");
  });

});
