'use strict';

(function() {
  var configs = require('./configs.js');
  module.exports = {
    configs: configs,
    login: function() {
      browser.get(configs.url);
      element.all(by.model('username')).sendKeys(configs.username);
      element.all(by.model('password')).sendKeys(configs.password);
      element.all(by.css('input[type="submit"]')).click();

      browser.sleep(configs.sleep);
    },
    selectDropdownByIndex: function (dropdown, index) {
      dropdown.click();
      if (index) {
        dropdown.all(by.tagName('option'))
          .then(function (options) {
            options[index].click();
          });
      }
    }
  };
}());