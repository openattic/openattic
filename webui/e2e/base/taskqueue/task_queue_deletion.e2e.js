"use strict";

var helpers = require("../../common.js");

// Defines task queue elements and common task queue related functions.
var qProperties = require("./task_queue_common.js");

describe("task queue moved deletion dialog", function () {

  beforeAll(function () {
    helpers.login();
    element(by.css(".tc_menuitem_ceph_osds")).click();
    qProperties.deleteAllTasks();
    qProperties.createTask(2); // short living ( < 30 sec)
    browser.sleep(helpers.configs.sleep);
    qProperties.open(); // This will open the task queue dialogue.
    qProperties.changeTab("pending");
    // Should try to remove a finished task to move to the moved tasks dialog
    var task = element.all(by.cssContainingText("tr", "wait")).first();
    task.click();
    browser.sleep(10000);
    qProperties.dialog.tabs.pending.elements.deleteBtn.click();
    qProperties.handleDeleteForm("pending", 1);
  });

  it("should have 1 moved task", function () {
    expect(qProperties.movedElements.movedTasks.count()).toBe(1);
  });

  it("should have a close button to close the dialog", function () {
    expect(qProperties.movedElements.close.isDisplayed()).toBe(true);
  });

  it("should delete all finished tasks", function () {
    qProperties.movedElements.close.click();
    qProperties.deleteTasks("finished");
    qProperties.close(); // This will open the task queue dialogue.
  });

  afterAll(function () {
    console.log("task_queue_deletion -> task_queue_deletion.e2e.js");
  });
});
