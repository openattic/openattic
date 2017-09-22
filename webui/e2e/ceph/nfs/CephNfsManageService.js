"use strict";

var CephNfsManageService = function () {

  this.manageServiceButton = element(by.css(".tc_manageService"));

  this.state = element.all(by.css(".tc_state"));
  this.stopServiceButton = element.all(by.css(".tc_stopService"));
  this.startServiceButton = element.all(by.css(".tc_startService"));

  this.closeButton = element.all(by.id("close"));

  this.startAllIfStopped = function () {
    var self = this;
    self.manageServiceButton.click();
    browser.findElements(by.css(".tc_startService"))
      .then(function () {
        self.startServiceButton.click();
        self.waitForState(/.*Starting*/, 0);
        self.waitForState(/.*Starting*/, 1);
        self.closeButton.click();
      })
      .catch(function () {
        self.closeButton.click();
      });
  };

  this.waitForState = function (state, n) {
    var self = this;
    self.state.get(n).getText().then(function (text) {
      if (text.match(state)) {
        browser.sleep(1000);
        self.waitForState(state, n);
      } else {
        return;
      }
    });
  };

};
module.exports = CephNfsManageService;
