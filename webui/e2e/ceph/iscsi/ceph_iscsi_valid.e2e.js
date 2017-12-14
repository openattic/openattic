"use strict";

var helpers = require("../../common.js");
var CephIscsiTable = require("./CephIscsiTable.js");
var CephIscsiForm = require("./CephIscsiForm.js");
var CephRbdCommon = require("../rbds/cephRbdCommon.js");

describe("ceph iscsi", function () {

  var table = new CephIscsiTable();
  var form = new CephIscsiForm();

  beforeAll(function () {
    helpers.login();
    element(by.css(".tc_menuitem_ceph_iscsi")).click();
    table.addTarget();
    form.submitButton.click();
  });

  it("should validate target id", function () {
    form.targetIdInput.clear().sendKeys("iqn.2017-1-27-112013306.org.linux-iscsi.igw.x86");
    expect(form.targetIdRequired.isDisplayed()).toBe(false);
    expect(form.targetIdInvalid.isDisplayed()).toBe(true);

    form.targetIdInput.clear();
    expect(form.targetIdRequired.isDisplayed()).toBe(true);
    expect(form.targetIdInvalid.isDisplayed()).toBe(false);

    form.targetIdInput.clear().sendKeys("iqn.2016-06.org.openattic:storage:disk.sn-a8675309");
    expect(form.targetIdInvalid.isDisplayed()).toBe(false);
    expect(form.targetIdRequired.isDisplayed()).toBe(false);
  });

  it("should validate portals", function () {
    expect(form.portalsRequired.isDisplayed()).toBe(true);

    form.addPortal(0);
    expect(form.portalsRequired.isDisplayed()).toBe(false);
  });

  it("should validate images", function () {
    expect(form.imagesRequired.isDisplayed()).toBe(true);

    form.addImage(0);
    expect(form.imagesRequired.isDisplayed()).toBe(false);
  });

  it("should validate lun", function () {
    form.openImageSettingsModal(0);
    form.lunIdInput.clear();
    expect(form.lunIdRequired.isDisplayed()).toBe(true);

    form.lunIdInput.sendKeys(1);
    expect(form.lunIdRequired.isDisplayed()).toBe(false);

    form.confirmImageSettingsModal();
  });

  it("should validate user", function () {
    form.authenticationCheckbox.click();

    expect(form.userRequired.isDisplayed()).toBe(true);

    form.userInput.clear().sendKeys("TargetUser");
    expect(form.userRequired.isDisplayed()).toBe(false);
  });

  it("should validate password", function () {
    expect(form.passwordRequired.isDisplayed()).toBe(true);

    form.passwordInput.clear().sendKeys("TargetPassword");
    expect(form.passwordRequired.isDisplayed()).toBe(false);
  });

  it("should validate initiators", function () {
    form.addInitiator();
    form.initiatorsInput.get(0).clear().sendKeys("...");
    expect(form.initiatorsRequired.get(0).isDisplayed()).toBe(false);
    expect(form.initiatorsInvalid.get(0).isDisplayed()).toBe(true);

    form.initiatorsInput.get(0).clear();
    expect(form.initiatorsRequired.get(0).isDisplayed()).toBe(true);
    expect(form.initiatorsInvalid.get(0).isDisplayed()).toBe(false);

    form.removeInitiator(0);
    form.addInitiator();
    form.initiatorsInput.get(0).clear().sendKeys("iqn.2016-06.org.openattic:storage:disk.sn-a8675310");
    expect(form.initiatorsRequired.get(0).isDisplayed()).toBe(false);
    expect(form.initiatorsInvalid.get(0).isDisplayed()).toBe(false);
  });

  it("should validate mutual user", function () {
    form.mutualAuthenticationCheckbox.click();

    expect(form.mutualUserRequired.isDisplayed()).toBe(true);

    form.mutualUserInput.sendKeys("TargetMutualUser");
    expect(form.mutualUserRequired.isDisplayed()).toBe(false);
  });

  it("should validate mutual password", function () {
    expect(form.mutualPasswordRequired.isDisplayed()).toBe(true);

    form.mutualPasswordInput.sendKeys("TargetMutualPassword");
    expect(form.mutualPasswordRequired.isDisplayed()).toBe(false);
  });

  it("should validate discovery user", function () {
    form.discoveryAuthenticationCheckbox.click();

    expect(form.discoveryUserRequired.isDisplayed()).toBe(true);

    form.discoveryUserInput.sendKeys("TargetDiscoveryUser");
    expect(form.discoveryUserRequired.isDisplayed()).toBe(false);
  });

  it("should validate discovery password", function () {
    expect(form.discoveryPasswordRequired.isDisplayed()).toBe(true);

    form.discoveryPasswordInput.sendKeys("TargetDiscoveryPassword");
    expect(form.discoveryPasswordRequired.isDisplayed()).toBe(false);
  });

  it("should validate discovery mutual user", function () {
    form.discoveryMutualAuthenticationCheckbox.click();

    expect(form.discoveryMutualUserRequired.isDisplayed()).toBe(true);

    form.discoveryMutualUserInput.sendKeys("TargetDiscoveryMutualUser");
    expect(form.discoveryMutualUserRequired.isDisplayed()).toBe(false);
  });

  it("should validate discovery mutual password", function () {
    expect(form.discoveryMutualPasswordRequired.isDisplayed()).toBe(true);

    form.discoveryMutualPasswordInput.sendKeys("TargetDiscoveryMutualPassword");
    expect(form.discoveryMutualPasswordRequired.isDisplayed()).toBe(false);
  });

  // Needs to be the last test case of class because it switches between the RBD and the iSCSI page
  // and after that the preconditions for all other tests of this class are no longer given.
  it("should show an error message for RBDs containing unsupported features", function() {
    var rbdName = "e2e_rbd_iscsi_not_valid";
    var rbdCommon = new CephRbdCommon();
    rbdCommon.cephRBDs.click();
    rbdCommon.deleteRbdIfExists(rbdName);
    rbdCommon.selectPool("iscsi-images");
    rbdCommon.createRbd(rbdName, "4.00 MiB", "4.00 MiB", rbdCommon.defaultFeatureCase);

    element(by.css(".tc_menuitem_ceph_iscsi")).click();
    table.addTarget();
    form.addPortal(0);
    form.addImageByName(rbdName);
    expect(form.imageFeatureError.isDisplayed()).toBe(true);

    form.submitButton.click();
    expect(browser.getCurrentUrl()).toContain("iscsi/add");

    rbdCommon.cephRBDs.click();
    rbdCommon.deleteRbd(rbdName);

    element(by.css(".tc_menuitem_ceph_iscsi")).click();
  });

  afterAll(function () {
    console.log("ceph_iscsi -> ceph_iscsi_valid.e2e.js");
  });

});
