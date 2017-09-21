var CephNfsTable = function(){

  var self = this;

  this.filterInput = element(by.model('filterConfig.search'));
  this.rows = element.all(by.binding('row.path'));
  this.detailsTab = element(by.css('.tc_detailsTab'));

  this.addExport = function(){
    element(by.css('.tc_add_btn')).click();
  };

  this.removeExportsIfExists = function (path) {
    browser.findElements(by.binding('row.path')).then(function () {
      element(by.model('filterConfig.search')).clear().sendKeys(path);
      element.all(by.cssContainingText('tr', path)).get(0).click();
      element(by.css('.tc_menudropdown')).click();
      element(by.css('.tc_deleteItem')).click();
      element(by.model('$ctrl.input.enteredName')).sendKeys('yes');
      element(by.id('bot2-Msg1')).click();
      element(by.model('filterConfig.search')).clear();
      self.removeExportsIfExists(path);
    }).catch(function () {
    });
  };

  this.clickRowByPath = function(path){
    this.filterInput.clear().sendKeys(path);
    element(by.cssContainingText('tr', path)).click();
  };

  this.editExport = function(path){
    this.clickRowByPath(path);
    element(by.css('.tc_edit_btn')).click();
  };

  this.cloneExport = function(path){
    this.clickRowByPath(path);
    element(by.css('.tc_menudropdown')).click();
    element(by.css('.tc_cloneItem')).click();
  };

  this.removeExport = function(path) {
    this.clickRowByPath(path);
    element(by.css('.tc_menudropdown')).click();
    element(by.css('.tc_deleteItem')).click();
    element(by.model('$ctrl.input.enteredName')).sendKeys('yes');
    element(by.id('bot2-Msg1')).click();
    this.filterInput.clear();
  };
};
module.exports = CephNfsTable;