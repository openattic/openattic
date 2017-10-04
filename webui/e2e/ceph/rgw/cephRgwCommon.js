"use strict";

var CephRgwCommons = function () {
  var helpers = require("../../common.js");

  this.submitBtn = element(by.css(".tc_submitButton"));
  this.backBtn = element(by.css(".tc_backButton"));
  this.addSubuserBtn = element(by.css(".tc_addSubuserButton"));
  this.submitSubuserBtn = element.all(by.css(".tc_submitButton")).first();
  this.cancelSubuserBtn = element(by.css(".tc_cancelSubuserButton"));
  this.addS3KeyBtn = element(by.css(".tc_addS3KeyButton"));
  this.submitS3KeyBtn = element.all(by.css(".tc_submitButton")).first();
  this.addCapBtn = element(by.css(".tc_addCapButton"));
  this.submitCapBtn = element.all(by.css(".tc_submitButton")).first();
  this.capabilitiesDT = element(by.cssContainingText("dt", "Capabilities:"));
  this.capabilitiesDD = element.all(by.repeater("cap in $ctrl.selection.item.caps | orderBy:'type'"));

  this.addUser = function () {
    element(by.css(".tc_addUser")).click();
    browser.sleep(helpers.configs.sleep);
  };

  this.editUser = function (uid) {
    helpers.get_list_element(uid).click();
    element(by.css(".tc_menudropdown")).click();
    element(by.css(".tc_editUser > a")).click();
    browser.sleep(helpers.configs.sleep);
  };

  this.addBucket = function () {
    element(by.css(".tc_addBucket")).click();
    browser.sleep(helpers.configs.sleep);
  };

  this.editBucket = function (name) {
    helpers.get_list_element(name).click();
    element(by.css(".tc_menudropdown")).click();
    element(by.css(".tc_editBucket > a")).click();
    browser.sleep(helpers.configs.sleep);
  };
};
module.exports = CephRgwCommons;
