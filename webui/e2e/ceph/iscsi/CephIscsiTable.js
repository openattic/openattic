"use strict";

const taskQueueHelpers = require("../../base/taskqueue/task_queue_common.js");

var CephIscsiTable = function () {


  this.filterInput = element(by.model("filterConfig.search"));
  this.rows = element.all(by.binding("row.targetId"));

  this.addTarget = function () {
    element(by.css(".tc_add_btn")).click();
  };

  this.editTarget = function (targetId) {
    this.clickRowByTargetId(targetId);
    element(by.css(".tc_edit_btn")).click();
  };

  this.cloneTarget = function (targetId) {
    this.clickRowByTargetId(targetId);
    element(by.css(".tc_menudropdown")).click();
    element(by.css(".tc_cloneItem")).click();
  };

  this.startAllTargets = function () {
    element(by.css(".tc_manageService")).click();
    element(by.css(".tc_deployItem")).click();
    element(by.css(".tc_manageService")).click();
    taskQueueHelpers.waitForPendingTasks();
    expect(element(by.css(".tc_deployItem")).getAttribute("class")).toContain("disabled");
    expect(element(by.css(".tc_undeployItem")).getAttribute("class")).not.toContain("disabled");
    this.filterInput.click();
  };

  this.stopAllTargets = function () {
    element(by.css(".tc_manageService")).click();
    element(by.css(".tc_undeployItem")).click();
    element(by.css(".tc_manageService")).click();
    taskQueueHelpers.waitForPendingTasks();
    expect(element(by.css(".tc_deployItem")).getAttribute("class")).not.toContain("disabled");
    expect(element(by.css(".tc_undeployItem")).getAttribute("class")).toContain("disabled");
    this.filterInput.click();
  };

  this.clickRowByTargetId = function (targetId) {
    this.filterInput.clear().sendKeys(targetId);
    element(by.cssContainingText("tr", targetId)).click();
  };

  this.removeTarget = function (targetId) {
    this.clickRowByTargetId(targetId);
    element(by.css(".tc_menudropdown")).click();
    element(by.css(".tc_deleteItem")).click();
    element(by.model("$ctrl.input.enteredName")).sendKeys("yes");
    element(by.css(".tc_submitButton")).click();
    expect(this.rows.get(0).isPresent()).toBe(false);
    this.filterInput.clear();
  };

  this.removeTargetIfExists = function (targetId) {
    browser.findElements(by.binding("row.targetId")).then(function () {
      element(by.model("filterConfig.search")).clear().sendKeys(targetId);
      element(by.cssContainingText("tr", targetId)).click();
      element(by.css(".tc_menudropdown")).click();
      element(by.css(".tc_deleteItem")).click();
      element(by.model("$ctrl.input.enteredName")).sendKeys("yes");
      element(by.css(".tc_submitButton")).click();
      element(by.model("filterConfig.search")).clear();
    }).catch(function () {
    });
  };

  this.stopAllIfStarted = function () {
    browser.findElement(by.css(".tc_deployItem.disabled")).then(function () {
      element(by.css(".tc_manageService")).click();
      element(by.css(".tc_undeployItem")).click();
    }).catch(function () {});
    taskQueueHelpers.waitForPendingTasks();
  };

  this.startAllIfStopped = function () {
    browser.findElement(by.css(".tc_undeployItem.disabled")).then(function () {
      element(by.css(".tc_manageService")).click();
      element(by.css(".tc_deployItem")).click();
    }).catch(function () {});
    taskQueueHelpers.waitForPendingTasks();
  };
};
module.exports = CephIscsiTable;
