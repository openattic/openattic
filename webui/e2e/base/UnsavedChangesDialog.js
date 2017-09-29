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
