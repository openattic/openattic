'use strict';

(function(){

  var configs = require('./configs.js');
  var volumesItem = element(by.css('ul .tc_menuitem_volumes > a'));
  var hostsItem = element(by.css('ul .tc_menuitem_hosts > a'));
  var volumePoolSelect = element(by.model('pool'));

  var helper = {
    configs: configs,

    get_list_element: function(itemName){
      return element(by.cssContainingText('tr', itemName));
    },

    /**
     * Will delete the selected items, using the default test classes for this.
     * @param {number} [dropdown] - which dropdown to get
     */
    delete_selection: function(dropdown, controllerName){
      dropdown = dropdown || 0;
      element.all(by.css('.tc_menudropdown')).get(dropdown).click();
      element(by.css('.tc_deleteItem > a')).click();
      browser.sleep(helper.configs.sleep);
      var enteredNameInput = 'input.enteredName';
      if (controllerName) {
        enteredNameInput = controllerName + '.' + enteredNameInput;
      }
      element(by.model(enteredNameInput)).sendKeys('yes');
      element(by.id('bot2-Msg1')).click();
      browser.sleep(helper.configs.sleep);
    },

    search_for: function(query){
      var search = element.all(by.model('filterConfig.search')).first();
      search.clear();
      search.sendKeys(query);
      browser.sleep(helper.configs.sleep);
    },

    login: function(){
      browser.get(configs.url);
      element.all(by.model('username')).sendKeys(configs.username);
      element.all(by.model('password')).sendKeys(configs.password);
      element.all(by.css('input[type="submit"]')).click();

      browser.sleep(configs.sleep);
    },

    create_volume: function(volumename, type, size, poolName){
      var pool;
      size = size == null ? '100MB' : size;

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
      expect(helper.get_list_element(volumename).isDisplayed()).toBe(true);
      return pool;
    },

    delete_volume: function(volume, volumename){
      volumesItem.click();
      browser.sleep(configs.sleep);
      element(by.css('.tc_entries_dropdown')).click();
      element(by.css('.tc_entries_100')).click();
      volume.click();
      browser.sleep(configs.sleep);
      helper.delete_selection();
      volume = helper.get_list_element(volumename);
      expect(volume.isPresent()).toBe(false);
    },

    /**
     * Will create snapshot of the given volume.
     * @param {element} volume - Where to create the snapshot.
     * @param {string} snapshotname - The name of snapshot.
     */
    create_snapshot: function(volume, snapshotname){
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
      browser.sleep(helper.configs.sleep);
      var snapshot = element(by.cssContainingText('tr', snapshotname));
      expect(snapshot.isDisplayed()).toBe(true);
    },

    /**
     * Will delete snapshot of the given volume.
     * @param {element} volume - Where to find the snapshot.
     * @param {string} snapshotname - The name of snapshot.
     */
    delete_snapshot: function(volume, snapshotname){
      expect(volume.isDisplayed()).toBe(true);
      volume.click();
      browser.sleep(400);
      element(by.css('.tc_snapshotTab')).click();
      browser.sleep(400);
      var snapshot = element(by.cssContainingText('tr', snapshotname));
      expect(snapshot.isDisplayed()).toBe(true);
      snapshot.click();
      browser.sleep(400);
      element(by.css('.tc_deleteSnapItem')).click();
      browser.sleep(400);
      element(by.id('bot2-Msg1')).click();
      browser.sleep(400);
      var snapshot = element(by.cssContainingText('tr', snapshotname));
      expect(snapshot.isPresent()).toBe(false);
    },

    /**
     * Creates volume clone out of snapshot of the given volume.
     * @param {element} volume - Where to create the snapshot clone.
     * @param {string} snapshotname - The name of snapshot.
     * @param {string} clonename - The name of clone.
     */
    create_snap_clone: function(volume, snapshotname, clonename){
      expect(volume.isDisplayed()).toBe(true);
      volume.click();
      browser.sleep(400);
      element(by.css('.tc_snapshotTab')).click();
      browser.sleep(400);
      var snapshot = element(by.cssContainingText('tr', snapshotname));
      expect(snapshot.isDisplayed()).toBe(true);
      snapshot.click();
      element.all(by.css('.tc_menudropdown')).get(1).click();
      browser.sleep(400);
      element(by.css('.tc_snap_clone')).click();
      browser.sleep(400);
      element(by.model('clone_obj.name')).sendKeys(clonename);
      element(by.id('bot2-Msg1')).click();
      browser.sleep(helper.configs.sleep);
      var clone = element(by.cssContainingText('tr', clonename));
      expect(clone.isDisplayed()).toBe(true);
    },

    /**
     * Creates a host with the given name and optinal an iqn or a fc name.
     * @param {string} hostname - Name of the host.
     * @param {string} [iqn] - Name of the IQN.
     * @param {string} [fc] - Name of the FC.
     */
    create_host: function(hostname, iqn, fc){
      element(by.css('ul .tc_menuitem_hosts > a')).click();
      element(by.css('.tc_addHost')).click();
      element(by.model('host.name')).sendKeys(hostname);
      if(iqn){
        element.all(by.model('type.check')).get(0).click();
        element.all(by.model('data[key]')).get(0).click();
        element.all(by.model('newTag.text')).get(0).sendKeys(iqn);
      }
      if(fc){
        element.all(by.model('type.check')).get(1).click();
        element.all(by.model('data[key]')).get(1).click();
        element.all(by.model('newTag.text')).get(0).sendKeys(fc);
      }
      browser.sleep(400);
      element(by.css('.tc_submitButton')).click();
      browser.sleep(400);
      expect(helper.get_list_element(hostname).isDisplayed()).toBe(true);
    },

    /**
     * Deletes the host with the given name.
     * @param {string} hostname - Name of the host.
     */
    delete_host: function(hostname){
      hostsItem.click();
      var host = helper.get_list_element(hostname);
      host.click();
      helper.delete_selection(undefined, '$ctrl');
      expect(host.isPresent()).toBe(false);
    },

    delete_nfs_share: function(volName, nfsName){
      volumesItem.click();
      var volume = helper.get_list_element(volName);
      expect(browser.getCurrentUrl()).toContain('/openattic/#/volumes');
      expect(volume.isDisplayed()).toBe(true);
      volume.click();
      element(by.css('.tc_nfsShareTab')).click();
      var share = element(by.cssContainingText('td', nfsName));
      expect(share.isDisplayed()).toBe(true);
      share.click();
      element(by.css('.tc_nfsShareDelete')).click();
      element(by.id('bot2-Msg1')).click();
      expect(share.isPresent()).toBe(false);
    },

    delete_cifs_share: function(volName, cifsName){
      volumesItem.click();
      var volume = helper.get_list_element(volName);
      expect(browser.getCurrentUrl()).toContain('/openattic/#/volumes');
      expect(volume.isDisplayed()).toBe(true);
      volume.click();
      element(by.css('.tc_cifsShareTab')).click();
      var share = element(by.cssContainingText('tr', cifsName));
      expect(share.isDisplayed()).toBe(true);
      share.click();
      element.all(by.css('.tc_menudropdown')).get(1).click();
      element(by.css('.tc_cifsShareDelete > a')).click();
      element(by.id('bot2-Msg1')).click();
      expect(share.isPresent()).toBe(false);
    },

    delete_fc_share: function(volName, hostname){
      volumesItem.click();
      var volume = helper.get_list_element(volName);
      expect(volume.isPresent()).toBe(true);
      volume.click();
      element(by.css('.tc_iscsi_fcTab')).click();
      var share = helper.get_list_element(hostname);
      share.click();
      element(by.css('.tc_lunDelete')).click();
      element(by.id('bot2-Msg1')).click();
      expect(share.isPresent()).toBe(false);
    }
  };
  module.exports = helper;
}());
