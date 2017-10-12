"use strict";

const helpers = require("../../common.js");
const CephPoolCommon = require("./cephPoolCommon.js");

describe("ceph pool edit form", function () {
  const cephPoolProperties = new CephPoolCommon();
  const name = "e2e-pools-edit";

  const editPool = () => {
    var pool = helpers.search_for_element(name);
    pool.click();
    cephPoolProperties.editButton.click();
  };

  const setPgNumber = (pgs) =>
    cephPoolProperties.getFormElement(cephPoolProperties.formElements.pgnum)
      .clear()
      .sendKeys(pgs)
      .sendKeys(protractor.Key.TAB);

  beforeAll(function () {
    helpers.login();
    helpers.setLocation("ceph/pools");
    cephPoolProperties.addButton.click();
    cephPoolProperties.createPool(name, "replicated", 32);
    editPool();
  });

  it("should contain edit in url", () => {
    expect(browser.getCurrentUrl()).toContain("/#/ceph/pools/edit/");
  });

  it("should not be possible to decrease pgnum", () => {
    setPgNumber(16);
    expect(cephPoolProperties.formElements.pgnum.items.helpPgnum.isDisplayed()).toBe(true);
    setPgNumber(32);
    expect(cephPoolProperties.formElements.pgnum.items.helpPgnum.isDisplayed()).toBe(false);
  });

  it("should be possible to increase pgnum", () => {
    setPgNumber(64);
    cephPoolProperties.submitForm(name, "replicated", 64);
    editPool();
  });

  it("should not be possible to submit without any apps", () => {
    cephPoolProperties.deleteFirstApp();
    cephPoolProperties.getFormElement(cephPoolProperties.formElements.createButton).click();
    expect(cephPoolProperties.formElements.selectApplication.items.appsRequired.isDisplayed()).toBe(true);
    cephPoolProperties.addApplication("cephfs");
  });

  it("should be possible to add an app", () => {
    cephPoolProperties.addApplication("rgw");
    cephPoolProperties.submitForm(name);
    expect(element(by.binding("selection.item.showApps")).getText()).toBe("cephfs, rgw");
    editPool();
    cephPoolProperties.deleteFirstApp();
    cephPoolProperties.deleteFirstApp();
    cephPoolProperties.addApplication("cephfs");
    cephPoolProperties.submitForm(name);
    editPool();
  });

  it("should show no dialog if nothing is edited", () => {
    helpers.setLocation("ceph/pools", false);
    editPool();
  });

  it("should show a dialog if something is edited", () => {
    cephPoolProperties.addApplication(1);
    helpers.setLocation("ceph/pools", true);
    editPool();
  });

  afterAll(function () {
    helpers.setLocation("ceph/pools");
    cephPoolProperties.deletePool(name);
    console.log("ceph_pool_edit -> ceph_pool_edit.e2e.js");
  });
});
