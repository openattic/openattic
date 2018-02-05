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

var UnsavedChangesDialog = function () {
  var self = this;

  this.leaveBtn = element(by.className("tc_leaveButton"));
  this.stayBtn = element(by.className("tc_cancelButton"));
  this.header = element(by.className("openattic-modal-header"));
  this.body = element(by.id("modal-body"));
  this.firstInputElement = element.all(by.css("input")).first();

  this.leaveBtnContent = "Leave this page";
  this.stayBtnContent = "Cancel";
  this.headerContent = "Unsaved Changes";
  this.bodyContent = "You have unsaved changes that will be lost if you decide to continue." +
    "\nAre you sure you want to leave this page?";

  this.expectDialogContent = function () {
    expect(self.header.isDisplayed()).toBe(true);
    expect(self.header.getText()).toBe(this.headerContent);
    expect(self.body.isDisplayed()).toBe(true);
    expect(self.body.getText()).toBe(this.bodyContent);
    expect(self.leaveBtn.isDisplayed()).toBe(true);
    expect(self.leaveBtn.getText()).toBe(this.leaveBtnContent);
    expect(self.stayBtn.isDisplayed()).toBe(true);
    expect(self.stayBtn.getText()).toBe(this.stayBtnContent);
  };

  this.close = function () {
    self.expectDialogContent();
    self.leaveBtn.click();
  };
};
module.exports = UnsavedChangesDialog;
