'use strict';

(function(){

  var configs = require('./configs.js');
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
    }
  };
  module.exports = helper;
}());
