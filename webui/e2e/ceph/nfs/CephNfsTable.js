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
      element(by.model("$ctrl.input.enteredName")).sendKeys("yes");
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
    element(by.model("$ctrl.input.enteredName")).sendKeys("yes");
    element(by.css(".tc_submitButton")).click();
    helpers.clear_search_for();
  };
}

module.exports = CephNfsTable;
