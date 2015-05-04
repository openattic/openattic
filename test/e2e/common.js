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

    create_blockvol: function(){
      var blockvol = require('./general/create_blockvol.e2e.js');
    },
    
    create_fsvol: function(){
      var fsvol = require('./general/create_fsvol.e2e.js');
    },
 
    delete_volume: function(){
      var del_blockvol = require('./general/delete_protractor_test_volume.e2e.js');  
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