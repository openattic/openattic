"use strict";

var helpers = require("../../common.js");
var page = require("./ceph_nodes_common");

describe("should test ceph node scrubing", function () {

  beforeAll(function () {
    helpers.login();
    page.cephNodes.click();
  });

  it("should show a disabled button for scrubbing", function () {
    expect(page.performTaskBtn.isDisplayed()).toBe(true);
    expect(helpers.hasClass(page.performTaskBtn, "disabled")).toBe(true);
  });

  it("should open a modal when you click on scrub", function () {
    page.allChecked.get(0).click();
    page.performTaskBtn.click();
    page.scrubLi.click();
    expect(page.scrubModal.isPresent()).toBe(true);
  });

  it("should apply scrubbing when you press submit", function () {
    page.submitBtn.click();
    expect(page.scrubModal.isPresent()).toBe(false);
  });

  it("should open a modal when you select multiple nodes and click on deep scrub", function () {
    page.allChecked.get(0).click();
    page.allChecked.get(1).click();
    page.performTaskBtn.click();
    page.deepScrubLi.click();
    expect(page.scrubModal.isPresent()).toBe(true);
  });

  it("should apply deep scrubbing when you press submit", function () {
    page.submitBtn.click();
    expect(page.scrubModal.isPresent()).toBe(false);
  });

  afterAll(function () {
    console.log("ceph_nodes -> ceph_nodes_scrub.e2e.js");
  });
});

