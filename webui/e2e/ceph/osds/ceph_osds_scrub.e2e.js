/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 SUSE LLC
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * This package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
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

