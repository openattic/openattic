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
const helpers = require("../../common.js");

class CephNfsTable {

  constructor () {
    this.rows = element.all(by.binding("row.path"));
    this.detailsTab = element(by.css(".tc_detailsTab"));
  }

  addExport () {
    element(by.css(".tc_add_btn")).click();
  }

  removeExportsIfExists (path) {
    browser.findElements(by.binding("row.path")).then(() => {
      helpers.search_for(path);
      element.all(by.cssContainingText("tr", path)).get(0).click();
      element(by.css(".tc_menudropdown")).click();
      element(by.css(".tc_deleteItem")).click();
      element(by.model("$ctrl.input.enteredName")).sendKeys(path);
      element(by.css(".tc_submitButton")).click();
      helpers.clear_search_for();
      this.removeExportsIfExists(path);
    }).catch(() => {});
  }

  clickRowByPath (path) {
    helpers.search_for(path);
    element(by.cssContainingText("tr", path)).click();
  }

  editExport (path) {
    this.clickRowByPath(path);
    element(by.css(".tc_edit_btn")).click();
  }

  cloneExport (path) {
    this.clickRowByPath(path);
    element(by.css(".tc_menudropdown")).click();
    element(by.css(".tc_cloneItem")).click();
  }

  removeExport (path) {
    this.clickRowByPath(path);
    element(by.css(".tc_menudropdown")).click();
    element(by.css(".tc_deleteItem")).click();
    element(by.model("$ctrl.input.enteredName")).sendKeys(path);
    element(by.css(".tc_submitButton")).click();
    helpers.clear_search_for();
  };
}

module.exports = CephNfsTable;
