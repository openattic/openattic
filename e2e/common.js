'use strict';

(function() {

  var configs = require('./configs.js');
  var volumesItem = element.all(by.css('ul .tc_menuitem')).get(3);
  var hostsItem = element.all(by.css('ul .tc_menuitem')).get(4);
  
  var volumename = 'protractor_test_volume';
  var volume = element(by.cssContainingText('tr', volumename));
  
  var snapshotname = 'protractor_test_snap';
  var snapshot = element(by.cssContainingText('tr', snapshotname));
  
  var clonename ="protractor_test_clone";
  var clone = element(by.cssContainingText('tr', clonename));
  
  var hostname ="protractor_test_host";
  var host = element(by.cssContainingText('tr', hostname));
  
  var volumePoolSelect = element(by.id('data.sourcePool'));
  
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
        var exact_poolname = pool.name;
        volumePoolSelect.click();
            element.all(by.cssContainingText('option', pool.name))      
            .then(function findMatch(pname){
            if (pool.name === pname){
                exact_poolname = pname;
                return true;
            }
        });
        if(exact_poolname){
          element.all(by.cssContainingText('option',exact_poolname)).get(0).click();
          element(by.id(type)).click();
          element(by.model('data.megs')).sendKeys('100MB');
          element(by.css('.tc_submitButton')).click();
          browser.sleep(configs.sleep);
        }
        break;
      }
    }, 
    
    delete_volume: function(){
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
      expect(volume.isDisplayed()).toBe(true);
      volume.click();
      browser.sleep(400);
      element(by.css('.tc_snapshotTab')).click();
      browser.sleep(400);
      element(by.css('.tc_snapshotAdd')).click();
      browser.sleep(400);
      element(by.id('snap.name')).clear();
      browser.sleep(400);
      element(by.model('snap.name')).sendKeys(snapshotname);
      browser.sleep(400);
      element(by.css('.tc_submitButton')).click();      
    },
    
    delete_snapshot: function(){
      volume.click();
      browser.sleep(400);
      element(by.css('.tc_snapshotTab')).click();
      browser.sleep(400);
      expect(snapshot.isPresent()).toBe(true);
      snapshot.click();
      browser.sleep(400);
      element(by.css('.tc_deleteSnapItem')).click();
      browser.sleep(400);
      element(by.id('bot2-Msg1')).click();
      browser.sleep(400);
    },
 
    create_snap_clone: function(){
      volume.click();
      browser.sleep(400);
      element(by.css('.tc_snapshotTab')).click();
      browser.sleep(400);
      expect(snapshot.isDisplayed()).toBe(true);
      snapshot.click();
      element.all(by.css('.tc_menudropdown')).get(1).click();
      browser.sleep(400);
      element(by.css('.tc_snap_clone')).click();
      browser.sleep(400);
      element(by.model('clone_obj.name')).sendKeys(clonename);
      element(by.id('bot2-Msg1')).click();
      browser.sleep(800);
    },
 
    delete_snap_clone: function(){
      clone.click();
      browser.sleep(400);
      element(by.css('.tc_menudropdown')).click();
      browser.sleep(400);
      element(by.css('.tc_deleteItem')).click();
      browser.sleep(400);

      element(by.model('input.enteredName')).sendKeys(clonename);
      element(by.id('bot2-Msg1')).click();      
    },
 
    create_host: function(){
      element.all(by.css('ul .tc_menuitem')).get(4).click();
      element(by.css('.tc_addHost')).click();
      element(by.model('host.name')).sendKeys(hostname);
      element(by.css('.tc_submitButton')).click();
      browser.sleep(400);        
    },
 
    delete_host: function(){
      hostsItem.click();
      host.click();
      browser.sleep(400);
      element(by.css('.tc_menudropdown')).click();
      browser.sleep(400);
      element(by.css('.tc_deleteHost')).click();
      browser.sleep(400);
      element(by.id('bot2-Msg1')).click();                
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