"use strict";

var helpers = require("../../common.js");
var CephIscsiTable = require("./CephIscsiTable.js");
var CephIscsiForm = require("./CephIscsiForm.js");
var CephIscsiDetails = require("./CephIscsiDetails.js");

describe("ceph iscsi", function () {

  var table = new CephIscsiTable();
  var form = new CephIscsiForm();
  var details = new CephIscsiDetails();

  beforeAll(function () {
    helpers.login();
    helpers.setLocation("ceph/iscsi");
    table.removeTargetIfExists("iqn.2016-06.org.openattic.test:storage:disk.tc-");
    table.removeTargetIfExists("iqn.2016-06.org.openattic.test:storage:disk.tc-");
    table.removeTargetIfExists("iqn.2016-06.org.openattic.test:storage:disk.tc-");
    table.startAllIfStopped();
  });

  it("should check the ceph iSCSI list target url", function () {
    helpers.checkLocation("ceph/iscsi");
  });

  it("should check the ceph iSCSI add target url", function () {
    table.addTarget();
    helpers.checkLocation("ceph/.*/iscsi/add");
  });

  it("should add a target", function () {
    form.targetIdInput.clear().sendKeys("iqn.2016-06.org.openattic.test:storage:disk.tc-add");
    expect(form.panelTitle.getText()).toBe("Target IQN: iqn.2016-06.org.openattic.test:storage:disk.tc-add");
    form.addPortal(0);
    form.addImage(0);
    form.authenticationCheckbox.click();
    form.userInput.sendKeys("TargetUser");
    form.passwordInput.sendKeys("TargetPassword");
    form.addInitiator();
    form.initiatorsInput.get(0).sendKeys("iqn.2016-06.org.openattic:storage:disk.sn-a8675310");
    browser.sleep(helpers.configs.sleep);
    form.mutualAuthenticationCheckbox.click();
    form.mutualUserInput.sendKeys("TargetMutualUser");
    form.mutualPasswordInput.sendKeys("TargetMutualPassword");
    form.discoveryAuthenticationCheckbox.click();
    form.discoveryUserInput.sendKeys("TargetDiscoveryUser");
    form.discoveryPasswordInput.sendKeys("TargetDiscoveryPassword");
    form.discoveryMutualAuthenticationCheckbox.click();
    form.discoveryMutualUserInput.sendKeys("TargetDiscoveryMutualUser");
    form.discoveryMutualPasswordInput.sendKeys("TargetDiscoveryMutualPassword");
    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
  });

  it("should display added target details", function () {
    table.clickRowByTargetId("iqn.2016-06.org.openattic.test:storage:disk.tc-add");
    expect(details.panelTitle.getText()).toBe("Details of iqn.2016-06.org.openattic.test:storage:disk.tc-add");
    expect(details.portalsDD.getText()).toMatch(/.*: \d+\.\d+\.\d+\.\d+/);
    expect(details.imagesDD.getText()).toMatch(/.*: .* \(lun: 0\)/);
    expect(details.noAuthenticationDD.get(0).isPresent()).toBe(false);
    expect(details.userDD.get(0).getText()).toBe("TargetUser");
    expect(details.initiatorDD.get(0).getText()).toBe("iqn.2016-06.org.openattic:storage:disk.sn-a8675310");
    expect(details.mutualUserDD.get(0).getText()).toBe("TargetMutualUser (Enabled)");
    expect(details.discoveryUserDD.get(0).getText()).toBe("TargetDiscoveryUser (Enabled)");
    expect(details.discoveryMutualUserDD.get(0).getText()).toBe("TargetDiscoveryMutualUser (Enabled)");
  });

  it("should check the ceph iSCSI edit target url", function () {
    table.editTarget("iqn.2016-06.org.openattic.test:storage:disk.tc-add");
    helpers.checkLocation("ceph/.*/iscsi/edit/iqn.2016-06.org.openattic.test:storage:disk.tc-add");
  });

  it("should edit target", function () {
    form.targetIdInput.clear().sendKeys("iqn.2016-06.org.openattic.test:storage:disk.tc-edit");
    expect(form.panelTitle.getText()).toBe("Target IQN: iqn.2016-06.org.openattic.test:storage:disk.tc-edit");
    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
  });

  it("should display edited target details", function () {
    table.clickRowByTargetId("iqn.2016-06.org.openattic.test:storage:disk.tc-edit");
    expect(details.panelTitle.getText()).toBe("Details of iqn.2016-06.org.openattic.test:storage:disk.tc-edit");
    expect(details.portalsDD.getText()).toMatch(/.*: \d+\.\d+\.\d+\.\d+/);
    expect(details.imagesDD.getText()).toMatch(/.*: .* \(lun: 0\)/);
    expect(details.noAuthenticationDD.get(0).isPresent()).toBe(false);
    expect(details.userDD.get(0).getText()).toBe("TargetUser");
    expect(details.initiatorDD.get(0).getText()).toBe("iqn.2016-06.org.openattic:storage:disk.sn-a8675310");
    expect(details.mutualUserDD.get(0).getText()).toBe("TargetMutualUser (Enabled)");
    expect(details.discoveryUserDD.get(0).getText()).toBe("TargetDiscoveryUser (Enabled)");
    expect(details.discoveryMutualUserDD.get(0).getText()).toBe("TargetDiscoveryMutualUser (Enabled)");
  });

  it("should check the ceph iSCSI clone target url", function () {
    table.cloneTarget("iqn.2016-06.org.openattic.test:storage:disk.tc-edit");
    helpers.checkLocation("ceph/.*/iscsi/clone/iqn.2016-06.org.openattic.test:storage:disk.tc-edit");
  });

  it("should clone target", function () {
    form.targetIdInput.clear().sendKeys("iqn.2016-06.org.openattic.test:storage:disk.tc-clone");
    expect(form.panelTitle.getText()).toBe("Target IQN: iqn.2016-06.org.openattic.test:storage:disk.tc-clone");
    expect(form.submitButton.isEnabled()).toBe(true);
    form.submitButton.click();
  });

  it("should display cloned target details", function () {
    table.clickRowByTargetId("iqn.2016-06.org.openattic.test:storage:disk.tc-clone");
    expect(details.panelTitle.getText()).toBe("Details of iqn.2016-06.org.openattic.test:storage:disk.tc-clone");
    expect(details.portalsDD.getText()).toMatch(/.*: \d+\.\d+\.\d+\.\d+/);
    expect(details.imagesDD.getText()).toMatch(/.*: .* \(lun: 0\)/);
    expect(details.noAuthenticationDD.get(0).isPresent()).toBe(false);
    expect(details.userDD.get(0).getText()).toBe("TargetUser");
    expect(details.initiatorDD.get(0).getText()).toBe("iqn.2016-06.org.openattic:storage:disk.sn-a8675310");
    expect(details.mutualUserDD.get(0).getText()).toBe("TargetMutualUser (Enabled)");
    expect(details.discoveryUserDD.get(0).getText()).toBe("TargetDiscoveryUser (Enabled)");
    expect(details.discoveryMutualUserDD.get(0).getText()).toBe("TargetDiscoveryMutualUser (Enabled)");
  });

  it("should stop lrbd service", function () {
    table.startAllIfStopped();
    table.stopAllTargets();
  });

  it("should start lrbd service", function () {
    table.stopAllIfStarted();
    table.startAllTargets();
  });

  it("should remove target", function () {
    table.removeTarget("iqn.2016-06.org.openattic.test:storage:disk.tc-edit");
    table.removeTarget("iqn.2016-06.org.openattic.test:storage:disk.tc-clone");
  });

  afterAll(function () {
    console.log("ceph_iscsi -> ceph_iscsi.e2e.js");
  });

});
