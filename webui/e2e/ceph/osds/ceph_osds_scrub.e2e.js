"use strict";

var helpers = require("../../common.js");
var page = require("./ceph_osds_common");

describe("should test ceph osd scrubing", function () {

  beforeAll(function () {
    helpers.login();
    page.cephOSDs.click();
  });

  it("should show a disabled button for scrubbing", function () {
    expect(page.performTaskBtn.isDisplayed()).toBe(true);
    expect(helpers.hasClass(page.performTaskBtn, "disabled")).toBe(true);
  });

  it("should open a modal when you click on scrub", function () {
    page.allTd.first().click();
    page.performTaskBtn.click();
    page.scrubLi.click();
    expect(page.scrubModal.isPresent()).toBe(true);
  });

  it("should apply scrubbing when you press submit", function () {
    page.submitBtn.click();
    expect(page.scrubModal.isPresent()).toBe(false);
  });

  it("should open a modal when you click on deep scrub", function () {
    page.allTd.first().click();
    page.performTaskBtn.click();
    page.deepScrubLi.click();
    expect(page.scrubModal.isPresent()).toBe(true);
  });

  it("should apply deep scrubbing when you press submit", function () {
    page.submitBtn.click();
    expect(page.scrubModal.isPresent()).toBe(false);
  });

  afterAll(function () {
    console.log("ceph_osds -> ceph_osds_scrub.e2e.js");
  });
});

