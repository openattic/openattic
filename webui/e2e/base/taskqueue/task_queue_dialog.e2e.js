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

const helpers = require("../../common.js");

// Defines task queue elements and common task queue related functions.
const qProperties = require("./task_queue_common.js");

describe("task queue dialog test", () => {
  beforeAll(() => {
    helpers.login();
    element(by.css(".tc_menuitem_ceph_osds")).click(); // Go to an listing in order to have less actions going on
    qProperties.createTask(1); // short living (~1 sec)
    qProperties.createTask(20); // long living (~5m)
  });

  it("should be able to change through all tabs", () => {
    qProperties.open();
    ["finished", "failed", "pending"].forEach((tab) => {
      qProperties.changeTab(tab);
      qProperties.expectAllTabElements(tab);
    });
    qProperties.close();
  });

  /**
   * Iterates over all task queue tabs
   * The sequence is "pending" -> "failed" -> "finished".
   *
   * The following will be done in each tab:
   * 1. Show at least one task in the current tab.
   * 2. Checkout each column of the tab.
   * 3. Checkout all default elements.
   * 4. Remove any tasks.
   * 5. Check the "no tasks available" message.
   */
  Object.keys(qProperties.dialog.tabs).forEach(tabName => { // [pending, failed, finished]
    describe("tests '" + tabName + "' tab", () => {
      const tab = qProperties.dialog.tabs[tabName];
      const elements = tab.elements;

      // 1. Show at least one task in the current tab.
      it('should show at least one task in tab "' + tabName + '"', () => {
        qProperties.open();
        qProperties.changeTab(tabName);
        helpers.waitForElementVisible(elements.listing);
        expect(elements.listing.isDisplayed()).toBe(true); // If at least one task is there the listing is shown.
      });

      // 2. Checkout each column of the tab.
      it('should display all columns in tab "' + tabName + '"', () => {
        qProperties.expectTabColumnsToBeDisplayed(tabName);
      });

      // 3. Remove any tasks.
      it('should empty the tasks in tab "' + tabName + '"', () => {
        expect(elements.listing.isDisplayed()).toBe(true);
        qProperties.deleteTasks(tabName);
      });

      // 4. Check the "no tasks available" message.
      it('should have an empty task queue in tab "' + tabName + '"', () => {
        helpers.waitForElementInvisible(elements.listing);
        expect(elements.listing.isDisplayed()).toBe(false);
        const noElements = elements.noElements;
        expect(noElements.isDisplayed()).toBe(true);
        expect(noElements.getText()).toBe("There are no " + tabName + " Tasks.");
        qProperties.close();
      });
    });
  });

  describe("Self test for waitForPendingTasks", () => {
    it("tests the waiting for task function", () => {
      qProperties.createTask(3);
      qProperties.createTask(5);
      qProperties.waitForPendingTasks();
      qProperties.validateTabName("pending", "Pending (0)"); // Verifies waitForPendingTasks
    });

    it("should delete all finished tasks", () => {
      qProperties.open();
      qProperties.deleteTasks("finished");
      qProperties.close();
    });
  });

  afterAll(() => {
    console.log("task_queue_dialog -> task_queue_dialog.e2e.js");
  });
});

