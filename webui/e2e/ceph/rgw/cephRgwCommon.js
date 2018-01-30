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

let CephRgwCommons = function () {
  let helpers = require("../../common.js");

  this.submitBtn = element(by.css(".tc_submitButton"));
  this.addSubuserBtn = element(by.css(".tc_addSubuserButton"));
  this.modalSubmitBtn = element.all(by.css(".tc_submitButton")).first();
  this.cancelSubuserBtn = element(by.css(".tc_cancelSubuserButton"));
  this.addS3KeyBtn = element(by.css(".tc_addS3KeyButton"));
  this.addCapBtn = element(by.css(".tc_addCapButton"));
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
