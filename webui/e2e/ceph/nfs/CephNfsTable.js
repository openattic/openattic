class CephNfsTable {

  constructor () {
    this.filterInput = element(by.model("filterConfig.search"));
    this.rows = element.all(by.binding("row.path"));
    this.detailsTab = element(by.css(".tc_detailsTab"));
  }

  addExport () {
    element(by.css(".tc_add_btn")).click();
  }

  removeExportsIfExists (path) {
    browser.findElements(by.binding("row.path")).then(() => {
      element(by.model("filterConfig.search")).clear().sendKeys(path);
      element.all(by.cssContainingText("tr", path)).get(0).click();
      element(by.css(".tc_menudropdown")).click();
      element(by.css(".tc_deleteItem")).click();
      element(by.model("$ctrl.input.enteredName")).sendKeys("yes");
      element(by.id("bot2-Msg1")).click();
      element(by.model("filterConfig.search")).clear();
      this.removeExportsIfExists(path);
    }).catch(() => {});
  }

  clickRowByPath (path) {
    this.filterInput.clear().sendKeys(path);
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
    element(by.id("bot2-Msg1")).click();
    this.filterInput.clear();
  };
}

module.exports = CephNfsTable;
