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

describe("Feedback", function () {
  var feedbackButton = element(by.css(".tc_feedbackButton"));
  var feedbackPanel = element(by.css(".tc_feedbackPanel"));
  var feedbackClose = element(by.css(".tc_feedbackClose"));
  var feedbackInformation = element(by.css(".tc_feedbackInformation"));
  var feedbackReportBug = element(by.css(".tc_feedbackReportBug"));
  var feedbackGetInvolved = element(by.css(".tc_feedbackGetInvolved"));

  beforeAll(function () {
    helpers.login();
  });

  it('should display a "Feedback" button with that the user can open the feedback panel', function () {
    // Verify that the feedback button is displayed
    expect(feedbackButton.isDisplayed()).toBe(true);
  });

  it('should open the feedback panel by clicking on the "Feedback" button when the panel is closed', function () {
    // Verify that the feedback panel is hidden
    expect(feedbackPanel.isDisplayed()).toBe(false);

    // Open the feedback panel
    feedbackButton.click();

    // Verify that the feedback panel is displayed
    helpers.waitForElementVisible(feedbackPanel);
    expect(feedbackPanel.isDisplayed()).toBe(true);

    // Refresh browser to restore defaults
    browser.refresh();
  });

  it('should close the feedback panel by clicking on the "Feedback" button when the panel is opened', function () {
    // Open the feedback panel
    feedbackButton.click();

    // Verify that the feedback panel is displayed
    helpers.waitForElementVisible(feedbackPanel);
    expect(feedbackPanel.isDisplayed()).toBe(true);

    // Close the feedback panel
    feedbackButton.click();

    // Verify that the feedback panel is hidden
    helpers.waitForElementInvisible(feedbackPanel);
    expect(feedbackPanel.isDisplayed()).toBe(false);
  });

  it('should close the feedback panel by clicking on the "X" button when the panel is opened', function () {
    // Open the feedback panel
    feedbackButton.click();

    // Verify that the feedback panel is displayed
    helpers.waitForElementVisible(feedbackPanel);
    expect(feedbackPanel.isDisplayed()).toBe(true);

    // Close the feedback panel
    feedbackClose.click();

    // Verify that the feedback panel is hidden
    helpers.waitForElementInvisible(feedbackPanel);
    expect(feedbackPanel.isDisplayed()).toBe(false);
  });

  it("should display an information text", function () {
    // Verify that the information text isn't displayed
    expect(feedbackInformation.isDisplayed()).toBe(false);

    // Open the feedback panel
    feedbackButton.click();

    // Verify that the information text is displayed
    helpers.waitForElementVisible(feedbackInformation);
    expect(feedbackInformation.isDisplayed()).toBe(true);

    // Close the feedback panel
    feedbackClose.click();
  });

  it('should display a "Report Bug" button', function () {
    // Verify that the report bug button isn't displayed
    expect(feedbackReportBug.isDisplayed()).toBe(false);

    // Open the feedback panel
    feedbackButton.click();

    // Verify that the report bug button is displayed
    helpers.waitForElementVisible(feedbackReportBug);
    expect(feedbackReportBug.isDisplayed()).toBe(true);

    // Close the feedback panel
    feedbackClose.click();
  });

  it('should display a "Get involved" button', function () {
    // Open the feedback panel
    feedbackButton.click();

    // Verify that the get involved button is displayed
    helpers.waitForElementVisible(feedbackGetInvolved);
    expect(feedbackGetInvolved.isDisplayed()).toBe(true);

    // Close the feedback panel
    feedbackClose.click();
  });

  it('should not display the "Feedback" module if the user is logged out', function () {
    // Log out
    element(by.css(".tc_logout a")).click();

    // Verify that the feedback button is not present
    expect(feedbackButton.isPresent()).toBe(false);
  });

  afterAll(function () {
    console.log("feedback -> feedback.e2e.js");
  });
});
