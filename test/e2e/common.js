'use strict';

(function() {
  var configs = require('./configs.js');
  var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
  var volumename = 'protractor_test_volume';
  module.exports = {
    configs: configs,
    login: function() {
      browser.get(configs.url);
      element.all(by.model('username')).sendKeys(configs.username);
      element.all(by.model('password')).sendKeys(configs.password);
      element.all(by.css('input[type="submit"]')).click();

      browser.sleep(configs.sleep);
    },
 
    create_volume: function(type){
      volumesItem.click();
      element(by.css('oadatatable .tc_add_btn')).click();
      for(var key in configs.pools) {
        element(by.id('volume.name')).sendKeys(volumename);
        var pool = configs.pools[key];
        var volumePoolSelect = element(by.id('data.sourcePool'));
        volumePoolSelect.click();
        volumePoolSelect.element(by.cssContainingText('option', pool.name)).click();
        element(by.id(type)).click();

        element(by.model('data.megs')).sendKeys('100MB');
        element(by.css('.tc_submitButton')).click();
        browser.sleep(configs.sleep);

        break;
      }
    }, 
    
    delete_volume: function(){
      var volume = element(by.cssContainingText('tr', volumename));
      volumesItem.click();
      browser.sleep(400);
      volume.click();
      browser.sleep(400);
      element(by.css('.tc_menudropdown')).click();
      browser.sleep(400);
      element(by.css('.tc_deleteItem')).click();
      browser.sleep(400);

      element(by.model('input.enteredName')).sendKeys(volumename);
      element(by.id('bot2-Msg1')).click();    
      expect(volume.isPresent()).toBe(false);
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