'use strict';

(function(){

  var configs = require('./configs.js');

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
      var enteredNameInput = 'input.enteredName';
      if(controllerName){
        enteredNameInput = controllerName + '.' + enteredNameInput;
      }
      element(by.model(enteredNameInput)).sendKeys('yes');
      element(by.id('bot2-Msg1')).click();
    },

    search_for: function(query){
      var search = element.all(by.model('filterConfig.search')).first();
      search.clear();
      search.sendKeys(query);
    },

    search_for_element: function(query){
      helper.search_for(query);
      return helper.get_list_element(query);
    },

    login: function(){
      browser.get(configs.url);
      element.all(by.model('username')).sendKeys(configs.username);
      element.all(by.model('password')).sendKeys(configs.password);
      element.all(by.css('input[type="submit"]')).click();
    },

    check_form: function(){
      var oaCheckFormOk = element(by.css('.oa-check-form-ok'));
      oaCheckFormOk.isPresent().then(function(result){
        if(result){
          oaCheckFormOk.click();
        }
      });
    }
  };
  module.exports = helper;
}());
