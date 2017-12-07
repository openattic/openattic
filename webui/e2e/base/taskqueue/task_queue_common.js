"use strict";

/**
 * Defines task queue elements and common task queue related functions.
 *
 * Defines the following elements:
 * - taskQueue - element to click to open the dialogue.
 * - dialog.tabs - Holds the name, elements, column descriptions of each tab.
 * - dialog.modalElements - Holds the default elements that exist in all tabs.
 * - deletionDialog - Holds the different texts and needed elements.
 *
 * Defines the following common functions:
 * - changeTab(String tab) - Changes to the given tab.
 * - open() - Opens the task queue dialog.
 * - close() - Closes the task queue dialog.
 * - waitForPendingTasks() - Waits for all pending tasks to finish, use it with care because it's recursive.
 * - createTask(int time) - Triggers an API-Call to create a test task with a specified time.
 * - deleteTasks(String tab [, String name]) - Deletes all or the given task name in the given tab.
 */
(function () {
  var self = {};
  var helpers = require("../../common.js");

  // The element to click to open the modal dialogue.
  self.taskQueue = element(by.className("tc_task-queue"));
  self.loadingElem = element(by.className("tc_loading_pending"));

  // Describes the dialog elements.
  self.dialog = {
    tabs: {
      pending: { // self.is the same attribute key used by the UI.
        name: "Pending",
        elements: {}, // Will be filled with protractor elements for each tab.
        columns: {
          description: { // self.is the same attribute key that's used by the API-Object.
            name: "Name"
            // 'element: protractorElement' will be inserted into each column.
          },
          created: {
            name: "Created"
          },
          percent: {
            name: "Complete"
          },
          approx: {
            name: "Estimated"
          }
        }
      },
      failed: {
        name: "Failed",
        elements: {},
        columns: {
          description: {
            name: "Name"
          },
          status: {
            name: "Reason"
          },
          created: {
            name: "Created"
          },
          approx: {
            name: "Runtime"
          },
          last_modified: {
            name: "Failed"
          }
        }
      },
      finished: {
        name: "Finished",
        elements: {},
        columns: {
          description: {
            name: "Name"
          },
          created: {
            name: "Created"
          },
          approx: {
            name: "Runtime"
          },
          last_modified: {
            name: "Finished"
          }
        }
      }
    },
    modalElements: { // Holds protractorElements.
      header: element(by.className("openattic-modal-header")),
      content: element(by.className("openattic-modal-content")),
      footer: element(by.className("openattic-modal-footer")),
      closeBtn: element(by.className("modal-close-btn"))
    },
    tabElements: { // self.is used to create elements for each tab for structure creation. (Internal use)
      tab: "tc_tab_",
      deleteBtn: "tc_task_delete_",
      loadingParagraph: "tc_loading_",
      refreshBtn: "tc_refreshBtn_",
      noElements: "tc_no_elements_",
      listing: "tc_listing_",
      selectAll: "tc_select_all_"
    }
  };

  self.movedElements = {
    close: element(by.className("tc-tab-del-close")),
    movedTasks: element.all(by.css("uib-accordion.tc-moved-tasks ul > li"))
  };

  /**
   * Adds elements to each tab.elements and adds an element to each column of the tab.
   * For internal use only.
   */
  Object.keys(self.dialog.tabs).forEach(function (tabName) {
    var tabElements = self.dialog.tabElements;
    var tab = self.dialog.tabs[tabName];
    /**
     * Uses dialog.tabElements to combine it with the tab names to create the tab elements.
     */
    Object.keys(tabElements).forEach(function (elementName) {
      var className = tabElements[elementName] + tabName;
      tab.elements[elementName] = element(by.className(className));
    });

    /**
     * Uses the attribute name of each column and tab name to create an column element.
     */
    Object.keys(tab.columns).forEach(function (columnName) {
      tab.columns[columnName].element = element(by.className("tc-col-" + tabName + "-" + columnName));
    });
  });

  /**
   * Holds the different texts and needed elements of the deletion dialog.
   */
  self.deletionDialog = {
    text: {
      warning: "If you delete running tasks, it will abort the execution and won't roll back what has been done " +
        "so far!",
      multiDelete: "You are about to delete multiple tasks."
    },
    element: {
      warning: element(by.className("tc-run-warn")),
      singleDelete: element(by.className("tc_delete_one")),
      multiDelete: element(by.className("tc_delete_multiple")),
      confirmBtn: element(by.className("tc-tab-del-confirm"))
    }
  };

  /*
   * Expects default buttons to be displayed or not.
   * @param {Boolean} displayed - What to expect.
   */
  self.expectDefaultModalElements = function (displayed) {
    var elements = self.dialog.modalElements;
    Object.keys(elements).forEach(function (elementName) {
      var modalElement = elements[elementName];
      expect(modalElement.isPresent()).toBe(displayed);
      if (displayed) {
        expect(modalElement.isDisplayed()).toBe(displayed);
      }
    });
  };

  /**
   * Changes to the given tab and expect default elements to be there.
   * @param {String} tabName
   */
  self.changeTab = function (tabName) {
    // browser.sleep(helpers.configs.sleep / 2);
    let elem = self.dialog.tabs[tabName].elements.tab;
    helpers.waitForElementVisible(elem);
    elem.click();
    self.expectDefaultModalElements(true);
    helpers.waitForElementInvisible(self.dialog.tabs[tabName].elements.loadingParagraph);
    // browser.sleep(helpers.configs.sleep / 2);
  };

  /**
   * Opens the task queue dialog and expect default elements to be there.
   */
  self.open = function () {
    self.taskQueue.click();
    self.expectDefaultModalElements(true);
  };

  /**
   * Closes the task queue dialog.
   */
  self.close = function () {
    browser.sleep(helpers.configs.sleep / 2);
    element(by.className("modal-close-btn")).click();
    self.expectDefaultModalElements(false);
  };

  /*
   * Will delete all tasks.
   * Expecting the dialog to be closed.
   */
  self.deleteAllTasks = function () {
    self.open();
    Object.keys(self.dialog.tabs).forEach(function (tabName) { // => [pending, failed, finished]
      var elements = self.dialog.tabs[tabName].elements;
      self.changeTab(tabName);
      elements.listing.isDisplayed().then(function (displayed) {
        if (displayed) { // If at least one task is there the listing is shown.
          self.deleteTasks(tabName);
        }
      });
    });
    self.close();
  };

  /**
   * Validates which tab is opened by the task queue.
   * Expecting the dialog to be closed.
   * @param {string} tab - Which tab to be expect.
   */
  self.validateDisplayedTab = function (tabName) {
    self.open();
    helpers.waitForElementVisible(self.dialog.tabs[tabName].elements.deleteBtn);
    expect(self.dialog.tabs[tabName].elements.deleteBtn.isDisplayed()).toBe(true);
    self.close();
  };

  /**
   * Validates the text shown by the given tab when you open the task queue.
   * Expecting the dialog to be closed.
   * @param {string} tab - Which tab text to get.
   * @param {string} tabText - Which text will be expected in the label.
   */
  self.validateTabName = function (tabName, tabText) {
    self.open();
    expect(self.dialog.tabs[tabName].elements.tab.getText()).toBe(tabText);
    self.close();
  };

  /**
   * Validates the text shown by the task queue directive in the header of oa.
   * Expecting the dialog to be closed.
   * @param {string} text - Which text will be expected.
   */
  self.validateTaskText = function (text) {
    expect(self.taskQueue.getText()).toBe(text);
  };

  /**
   * Waits for all pending tasks to finish, use it with care because it's recursive.
   * Expecting the dialog to be closed.
   * @param {int} [depth] - Given by the recursive call.
   */
  self.waitForPendingTasks = function () {
    self.open(); // Opens the dialog
    self.changeTab("pending");
    helpers.waitForElementVisible(self.dialog.tabs.pending.elements.noElements); //Make sure the element is visible
    self.close(); // Closes the dialog when there are zero pending tasks.
  };

  /**
   * Triggers an API-Call to create a test task with a specified time.
   * It executes an XMLHttpRequest to the api with the login data provided by configs.js.
   * @param {int} times - One round takes around 1 1/2 seconds.
   * @param {int} [quantity] - How many task should be created..
   */
  self.createTask = function (times, quantity) {
    quantity = quantity || 1;
    for (var x = 0; x < quantity; x++) {
      browser.executeScript(function (innerTimes, configs) {
        var xhr = new XMLHttpRequest();
        var parts = configs.urls.base.split("/");
        var url = parts[0] + "//" + configs.username + ":" + configs.password + "@" +
          parts[2] + configs.urls.api + "taskqueue/test_task";
        xhr.open("post", url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({times: innerTimes}));
      }, times, helpers.configs);
    }
  };

  /**
   * Deletes all or the given task name in the given tab.
   * @param {String} tabName - Name of the tasks where the deletion takes place and which is displayed.
   * @param {String} [taskName] - Name of the task to delete.
   */
  self.deleteTasks = function (tabName, taskName) {
    self.changeTab(tabName);
    var deleteBtn = self.dialog.tabs[tabName].elements.deleteBtn;
    if (taskName) { // If a singel deletion takes place.
      helpers.waitForElementVisible(element(by.cssContainingText("tr", taskName)));
      var task = element.all(by.cssContainingText("tr", taskName)).first();
      expect(task.isDisplayed()).toBe(true);
      task.click();
    } else { // Delete all tasks in the tabName.
      helpers.waitForElementVisible(self.dialog.tabs[tabName].elements.selectAll);
      self.dialog.tabs[tabName].elements.selectAll.click();
    }
    var itemLength = 1;
    self.dialog.tabs.pending.elements.tab.getText().then(function (s) {
      itemLength = parseInt(s.match(/[0-9]+/)[0], 10);
    });
    deleteBtn.click();
    self.handleDeleteForm(tabName, itemLength);
  };

  /**
   * Is used to determine if everything is alright while deleting.
   * You should't call self.function from outside.
   * @param {String} tabName - Name of the current tab.
   * @param {String} itemLength - Count of how many items being deleted.
   */
  self.handleDeleteForm = function (tabName, itemLength) {
    var dialog = self.deletionDialog;
    var elements = dialog.element;
    var warning = elements.warning;
    var singleDelete = elements.singleDelete;
    var multiDelete = elements.multiDelete;
    var confirmBtn = elements.confirmBtn;
    var showWarning = tabName === "pending";
    // Should only show the warning if you want to delete a pending task.
    expect(warning.isDisplayed()).toBe(showWarning);
    if (showWarning) {
      expect(warning.getText()).toBe(dialog.text.warning);
    }
    multiDelete.isDisplayed().then(function (displayed) {
      // If you delete multiple tasks you the single deletion can't be shown and vice versa.
      expect(singleDelete.isDisplayed()).toBe(!displayed);
    });
    if (itemLength > 1) {
      expect($$("uib-accordion.tc-tasks-to-delete ul > li").count()).toBe(itemLength);
    }
    expect(confirmBtn.isDisplayed()).toBe(true);
    expect(confirmBtn.getText()).toBe("Delete");
    confirmBtn.click();
    browser.sleep(helpers.configs.sleep / 2);
  };
  module.exports = self;
}());

