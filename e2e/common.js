'use strict';

(function(){
  var configs = require('./configs.js');
  var UnsavedChangesDialog = require('./base/UnsavedChangesDialog.js');

  var helper = {
    configs: configs,

    /**
     * Get the absolute URL, e.g. 'http://192.168.10.105:8000/openattic/#/login'.
     * @param {string} inPageUrl The in-page URL, e.g. 'login'.
     * @return {string} Returns the requested absolute URL.
     */
    getUrl: (inPageUrl) => {
      return configs.urls.base + helper.getAbsLocationUrl(inPageUrl);
    },

    /**
     * Get the absolute location URL, e.g. '/openattic/#/ceph/pools'.
     * @param {string} inPageUrl The in-page URL, e.g. 'ceph/pools'.
     * @return {string} Returns the requested absolute location URL.
     */
    getAbsLocationUrl: (inPageUrl) => {
      return configs.urls.ui + inPageUrl;
    },

    /**
     * Browse to the specified page using in-page navigation.
     * @param {string} inPageUrl The in-page URL, e.g. 'ceph/pools'.
     * @param {boolean} dialogIsShown Set to TRUE to check whether the dialog
     *                                for unsaved changes is displayed.
     */
    setLocation: (inPageUrl, dialogIsShown) => {
      browser.setLocation(inPageUrl);
      helper.checkForUnsavedChanges(dialogIsShown);
      helper.checkLocation(inPageUrl);
    },

    /**
     * Ensure that the specified in-page URL equals with the current page.
     * @param {string} inPageUrl The in-page URL, e.g. 'ceph/rgw/users'.
     *                           This can be a regular expression.
     */
    checkLocation: (inPageUrl) => {
      const expected = helper.getAbsLocationUrl(inPageUrl);
      expect(browser.getCurrentUrl()).toMatch(expected);
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
    get_list_element_cells: function(itemName){
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

    /**
     * Log into the WebUI.
     * @param {string} username The username to use. Defaults to the
     *                          configs.username if not set.
     * @param {string} password The password to use. Defaults to the
     *                          configs.password if not set.
     * @param {boolean} browse Set to FALSE to do not browse to the
     *                         login page. Defaults to TRUE.
     */
    login: function(username, password, browse){
      username = username || configs.username;
      password = password || configs.password;
      browse = (browse !== undefined) ? browse : true;
      if (browse) {
        browser.get(helper.getUrl('login'));
      }
      element.all(by.model('username')).clear().sendKeys(username);
      element.all(by.model('password')).clear().sendKeys(password);
      element.all(by.css('input[type="submit"]')).click();
    },

    changeInput: (e, val) => e.clear().sendKeys(val).sendKeys(protractor.Key.TAB),

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
