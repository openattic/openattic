var CephNfsManageService = function(){

  this.manageServiceButton = element(by.css('.tc_manageService'));

  this.state = element.all(by.css('.tc_state'));
  this.stopServiceButton = element.all(by.css('.tc_stopService'));
  this.startServiceButton = element.all(by.css('.tc_startService'));

  this.closeButton = element.all(by.id('close'));

  this.startAllIfStopped = function () {
    var self = this;
    self.manageServiceButton.click();
    browser.findElements(by.css('.tc_startService')).then(function(){
      self.startServiceButton.click();
      self.closeButton.click();
    }).catch(function(){self.closeButton.click()});
  };

};
module.exports = CephNfsManageService;