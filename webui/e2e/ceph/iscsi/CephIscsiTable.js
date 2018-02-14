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

  this.clickRowByTargetId = function (targetId) {
    this.filterInput.clear().sendKeys(targetId);
    element(by.cssContainingText("tr", targetId)).click();
  };

  this.removeTarget = function (targetId) {
    this.clickRowByTargetId(targetId);
    element(by.css(".tc_menudropdown")).click();
    element(by.css(".tc_deleteItem")).click();
    element(by.model("$ctrl.input.enteredName")).sendKeys(targetId);
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
      element(by.model("$ctrl.input.enteredName")).sendKeys(targetId);
      element(by.css(".tc_submitButton")).click();
      element(by.model("filterConfig.search")).clear();
    }).catch(function () {
    });
  };

};
module.exports = CephIscsiTable;
