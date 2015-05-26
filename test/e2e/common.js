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
      var blockvol = require('./helpers/create_blockvol.e2e.js');
    },
    
    create_fsvol: function(){
      var fsvol = require('./helpers/create_fsvol.e2e.js');
    },
 
    delete_volume: function(){
      var del_vol = require('./helpers/delete_protractor_test_volume.e2e.js');
    },
 
    create_snapshot: function(){
      var create_snap = require('./helpers/create_snapshot.e2e.js');
    },
    
    delete_snapshot: function(){
      var delete_snap = require('./helpers/delete_snapshot.e2e.js');
    },
 
    create_snap_clone: function(){
        var create_snapclone = require('./helpers/create_snap_clone.e2e.js');
    },
 
    delete_snap_clone: function(){
        var delete_snapclone = require('./helpers/delete_snap_clone.e2e.js');
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