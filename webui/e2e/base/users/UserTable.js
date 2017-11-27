"use strict";

const UserTable = function () {

  this.addUser = function () {
    element(by.css(".tc_addUser")).click();
  };

  this.removeUser = function (username) {
    element(by.cssContainingText("tr", username)).click();
    element(by.css(".tc_menudropdown")).click();
    element(by.css(".tc_deleteUser > a")).click();
    browser.sleep(400);
    element(by.id("bot2-Msg1")).click();
  };

  this.removeUserIfExists = function (username) {
    browser.findElements(by.cssContainingText("tr", username)).then(function () {
      element(by.cssContainingText("tr", username)).click();
      element(by.css(".tc_menudropdown")).click();
      element(by.css(".tc_deleteUser")).click();
      browser.sleep(400);
      element(by.id("bot2-Msg1")).click();
    }).catch(function () {
    });
  };
};
module.exports = UserTable;
