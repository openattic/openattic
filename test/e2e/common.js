'use strict';

(function() {
  module.exports = {
    login: function() {
      browser.get('http://172.16.13.135/openattic/angular/login.html');
      element.all(by.model('username')).sendKeys('openattic');
      element.all(by.model('password')).sendKeys('openattic');
      element.all(by.css('input[type="submit"]')).click();

      browser.sleep(2000);
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