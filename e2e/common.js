'use strict';

(function(){

  var configs = require('./configs.js');
  var volumesItem = element(by.css('ul .tc_menuitem_volumes > a'));
  var hostsItem = element(by.css('ul .tc_menuitem_hosts > a'));

  var volumename = '';
  var volume = element(by.cssContainingText('tr', volumename));

  var snapshotname = 'protractor_test_snap';
  var snapshot = element(by.cssContainingText('tr', snapshotname));

  var clonename = "protractor_test_clone";
  var clone = element(by.cssContainingText('tr', clonename));

  var hostname = "protractor_test_host";
  var host = element(by.cssContainingText('tr', hostname));

  var volumePoolSelect = element(by.model('pool'));

  module.exports = {
    configs: configs,
    login: function(){
      browser.get(configs.url);
      element.all(by.model('username')).sendKeys(configs.username);
      element.all(by.model('password')).sendKeys(configs.password);
      element.all(by.css('input[type="submit"]')).click();

      browser.sleep(configs.sleep);
    },

    create_volume: function(volumename, type, size, poolName){
      var pool;
      var size = size == null ? "100MB" : size;

      volumesItem.click();
      element(by.css('oadatatable .tc_add_btn')).click();

      if(!poolName){
        for(var key in configs.pools){
          pool = configs.pools[key];
          poolName = pool.name;
          break;
        }
      }
      element(by.model('result.name')).sendKeys(volumename);
      volumePoolSelect.sendKeys(poolName);
      element(by.id(type)).click();
      element(by.model('data.megs')).sendKeys(size);
      element(by.css('.tc_submitButton')).click();
      browser.sleep(configs.sleep);
      return pool;
    },

    delete_volume: function(volume, volumename){
      volumesItem.click();
      browser.sleep(400);
      element(by.css('.tc_entries_dropdown')).click();
      browser.sleep(400);
      element(by.css('.tc_entries_100')).click();
      browser.sleep(400);
      volume.click();
      browser.sleep(400);
      element(by.css('.tc_menudropdown')).click();
      browser.sleep(400);
      element(by.css('.tc_deleteItem > a')).click();
      browser.sleep(400);
      element(by.model('input.enteredName')).sendKeys('yes');
      element(by.id('bot2-Msg1')).click();
      browser.sleep(600);
      volume = element(by.cssContainingText('tr', volumename));
      expect(volume.isPresent()).toBe(false);
    },

    create_snapshot: function(volume){
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

    delete_snapshot: function(volume){
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

    create_snap_clone: function(volume){
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
      element.all(by.css('.tc_menudropdown')).get(0).click();
      browser.sleep(400);
      element(by.css('.tc_deleteItem > a')).click();
      browser.sleep(400);

      element(by.model('input.enteredName')).sendKeys('yes');
      element(by.id('bot2-Msg1')).click();
    },

    create_host: function(){
      element(by.css('ul .tc_menuitem_hosts > a')).click();
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
      element(by.css('.tc_deleteHost > a')).click();
      browser.sleep(400);
      element(by.id('bot2-Msg1')).click();
    },

    check_wizard_titles: function(){
      var wizards = element.all(by.repeater('wizard in wizards'))
        .then(function(wizards){
          wizards[0].element(by.css('.tc_wizardTitle')).evaluate('wizard.title').then(function(title){
            expect(title).toEqual('File Storage');
            //console.log(title);
          });

          wizards[1].element(by.css('.tc_wizardTitle')).evaluate('wizard.title').then(function(vm_title){
            expect(vm_title).toEqual('VM Storage');
            //console.log(vm_title);
          });

          wizards[2].element(by.css('.tc_wizardTitle')).evaluate('wizard.title').then(function(block_title){
            expect(block_title).toEqual('iSCSI/Fibre Channel target');
            //console.log(block_title);
          });
      });
    },
  };
}());
