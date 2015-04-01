'use strict';

var configs = {
  url     : 'http://172.16.13.135/openattic/angular/login.html',
  username: 'openattic',
  password: 'openattic',
  sleep   : 2000,
  pools   : {
    vg: {
      name: 'vg_lorlen',
      size: '19.70GB'
    },
    btrfs: {
      name: 'testnfs',
      size: '100.00MB'
    },
    zfs: {
      name: 'tank',
      size: '19.60GB'
    }
  }
};

(function() {
  module.exports = {
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