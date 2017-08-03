'use strict';

(function(){
  var configs = require('./configs.js');
  var UnsavedChangesDialog = require('./base/UnsavedChangesDialog.js');

  var helper = {
    configs: configs,

    setLocation: function(location, dialogIsShown){
      browser.setLocation(location);
      helper.checkForUnsavedChanges(dialogIsShown);
      expect(browser.getCurrentUrl()).toContain('/openattic/#/' + location);
    },

    leaveForm: function(dialogIsShown){
      element(by.css('.tc_backButton')).click();
      helper.checkForUnsavedChanges(dialogIsShown);
    },

    checkForUnsavedChanges: function(dialogIsShown){
      var dialog =  new UnsavedChangesDialog();
      if(dialogIsShown !== undefined){
        expect(dialog.leaveBtn.isPresent()).toBe(dialogIsShown);
      }
      dialog.leaveBtn.isDisplayed().then(function(){
        dialog.close();
      }).catch(function(){});
    },

    get_list_element: function(itemName){
      return element(by.cssContainingText('tr', itemName));
    },

    /**
     * Get the cells of the specified row.
     * @param itemName The value to identify the data table row.
     */
    get_list_element_cells: function(itemName) {
      var row = helper.get_list_element(itemName);
      return row.all(by.tagName('td'));
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
      element.all(by.model('username')).clear();
      element.all(by.model('username')).sendKeys(configs.username);
      element.all(by.model('password')).clear();
      element.all(by.model('password')).sendKeys(configs.password);
      element.all(by.css('input[type="submit"]')).click();
    },

    /**
     * Check if the given element has the given class.
     * @param {object} element The element to check.
     * @param {string} cls The name of the class to check for.
     */
    hasClass: function(element, cls){
      return element.getAttribute('class').then(function(classes){
        return classes.split(' ').indexOf(cls) !== -1;
      });
    }
  };
  module.exports = helper;
}());
