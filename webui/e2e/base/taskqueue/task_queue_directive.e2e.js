"use strict";

var helpers = require("../../common.js");

// Defines task queue elements and common task queue related functions.
var qProperties = require("./task_queue_common.js");

describe("task queue directive test", function () {
  /**
   * Validates the text of the task queue "button" in the header
   * and validates the lable of a specific panel.
   * Task-Queue has to be closed for this.
   */
  var validateTaskTabText = function (taskText, tabName) {
    qProperties.validateDisplayedTab(tabName);
    qProperties.validateTaskText(taskText);
  };

  /**
   * Will clear all tasks if any.
   */
  beforeAll(function () {
    helpers.login();
    element(by.css(".tc_menuitem_ceph_osds")).click();
    qProperties.deleteAllTasks();
  });

  it("Should display the Background-Tasks if empty", function () {
    qProperties.validateTaskText("Background-Tasks");
  });

  it("Should display the 1 Background-Task", function () {
    qProperties.createTask(5);
    qProperties.open();
    qProperties.close();
    validateTaskTabText("1 Background-Task", "pending");
    qProperties.waitForPendingTasks();
  });

  it("Should display the 2 Background-Tasks", function () {
    qProperties.createTask(5);
    qProperties.createTask(5);
    qProperties.open();
    qProperties.close();
    validateTaskTabText("2 Background-Tasks", "pending");
    qProperties.waitForPendingTasks();
  });

  it("Should display the 1 Failed-Task", function () {
    qProperties.createTask(25);
    qProperties.open();
    qProperties.deleteTasks("pending", "wait");
    qProperties.close();
    validateTaskTabText("1 Failed-Task", "failed");
    qProperties.open();
    qProperties.deleteTasks("failed");
    qProperties.close();
  });

  it("Should display the 2 Failed-Tasks", function () {
    qProperties.createTask(25);
    qProperties.createTask(25);
    qProperties.open();
    qProperties.deleteTasks("pending", "wait");
    qProperties.deleteTasks("pending", "wait");
    qProperties.close();
    validateTaskTabText("2 Failed-Tasks", "failed");
    qProperties.open();
    qProperties.deleteTasks("failed");
    qProperties.close();
  });

  /**
   * This is a test for test cases that use the waitForPendingTasks function.
   */
  it("Tests the waiting for task function", function () {
    qProperties.createTask(3);
    qProperties.waitForPendingTasks();
    qProperties.validateTabName("pending", "Pending (0)");
  });

  /**
   * Deletes all created tasks.
   */
  afterAll(function () {
    qProperties.open();
    qProperties.deleteTasks("finished");
    qProperties.close();
    console.log("task_queue_directive -> task_queue_directive.e2e.js");
  });
});
