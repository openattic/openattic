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
    element(by.css(".tc_menuitem_ceph_osds")).click();
    qProperties.createTask(1); // short living (~1 sec)
    browser.sleep(helpers.configs.sleep);
    qProperties.createTask(30);
    qProperties.open(); // This will open the task queue dialogue.
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
    const tab = qProperties.dialog.tabs[tabName];
    const elements = tab.elements;

    // 1. Show at least one task in the current tab.
    it('should show at least one task in tab "' + tabName + '"', () => {
      qProperties.changeTab(tabName);
      helpers.waitForElementVisible(elements.listing);
      expect(elements.listing.isDisplayed()).toBe(true); // If at least one task is there the listing is shown.
    });

    // 2. Checkout each column of the tab.
    Object.keys(tab.columns).forEach(columnAttributeName => {
      const column = tab.columns[columnAttributeName];
      const columnName = column.name;
      const columnElement = column.element;
      it('should display this column in tab -> Column: "' + columnName + '", Tab: "' + tabName + '"', () => {
        expect(columnElement.isDisplayed()).toBe(true);
        expect(columnElement.getText()).toBe(columnName);
      });
    });

    // 3. Checkout all default elements.
    Object.keys(elements).forEach(elementName => {
      it('should check if this element exists in the tab -> Element: "' +
          elementName + '", Tab: "' + tabName + '"', () => {
        expect(elements[elementName].isPresent()).toBe(true);
      });
    });

    // 4. Remove any tasks.
    it('should empty the tasks in tab "' + tabName + '"', () => {
      expect(elements.listing.isDisplayed()).toBe(true);
      qProperties.deleteTasks(tabName);
    });

    // 5. Check the "no tasks available" message.
    it('should have an empty task queue in tab "' + tabName + '"', () => {
      helpers.waitForElementInvisible(elements.listing);
      expect(elements.listing.isDisplayed()).toBe(false);
      const noElements = element(by.className("tc_no_elements_" + tabName));
      expect(noElements.isDisplayed()).toBe(true);
      expect(noElements.getText()).toBe("There are no " + tabName + " Tasks.");
    });
  });

  afterAll(() => {
    qProperties.close(); // This will open the task queue dialogue.
    console.log("task_queue_dialog -> task_queue_dialog.e2e.js");
  });
});

