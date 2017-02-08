'use strict';

var helpers = require('../../common.js');
var qProperties = require('./task_queue_common.js'); // Defines task queue elements and common task queue related functions.

describe('task queue dialog test', function(){
  /**
   * This will create 60 finished tasks, 1 failed task and 1 pending task.
   * The task queue dialog will be opened.
   */
  beforeAll(function(){
    helpers.login();
    qProperties.open(); // This will open the task queue dialogue.
    qProperties.createTask(1, 60); // short living (~1 sec)
    browser.sleep(helpers.configs.sleep * 5);
    qProperties.createTask(500); // long living (~10 min)
    qProperties.deleteTasks('pending');
    qProperties.createTask(500); // long living (~10 min)
  });

  /**
   * Iterates over all task queue tabs
   * The sequence is "pending" -> "failed" -> "finished".
   *
   * The following will be done in each tab:
   * 1. Show at least one task in the current tab.
   * 2. Checkout each column of the tab.
   * 3. Checkout all default elements.
   * 4. Remove any tasks.
   * 5. Check the "no tasks available" message.
   */
  Object.keys(qProperties.dialog.tabs).forEach(function(tabName){ // => [pending, failed, finished]
    var tab = qProperties.dialog.tabs[tabName];
    var elements = tab.elements;

    // 1. Show at least one task in the current tab.
    it('should show at least one task in tab "' + tabName + '"', function(){
      qProperties.changeTab(tabName);
      var listing = elements.listing;
      expect(listing.isDisplayed()).toBe(true); // If at least one task is there the listing is shown.
    });

    // 2. Checkout each column of the tab.
    Object.keys(tab.columns).forEach(function(columnAttributeName){
      var column = tab.columns[columnAttributeName];
      var columnName = column.name;
      var columnElement = column.element;
      it('should display this column in tab -> Column: "' + columnName + '", Tab: "' + tabName + '"', function(){
        qProperties.changeTab(tabName);
        expect(columnElement.isDisplayed()).toBe(true);
        expect(columnElement.getText()).toBe(columnName);
      });
    });

    // 3. Checkout all default elements.
    Object.keys(elements).forEach(function(elementName){
      it('should check if this element exists in the tab -> Element: "' + elementName + '", Tab: "' + tabName + '"', function(){
        qProperties.changeTab(tabName);
        expect(elements[elementName].isPresent()).toBe(true);
      });
    });

    // 4. Remove any tasks.
    it('should empty the tasks if any, in tab "' +  tabName + '"', function(){
      qProperties.changeTab(tabName);
      elements.listing.isDisplayed().then(function(displayed){
        if(displayed){ // If at least one task is there the listing is shown.
          qProperties.deleteTasks(tabName);
        }
      });
    });

    // 5. Check the "no tasks available" message.
    it('should have an empty task queue in tab "' + tabName + '"', function(){
      var noElements = elements.noElements;
      qProperties.changeTab(tabName);
      expect(elements.listing.isDisplayed()).toBe(false);
      expect(noElements.isDisplayed()).toBe(true);
      expect(noElements.getText()).toBe('There are no ' + tabName + ' Tasks.');
    });
  });

  afterAll(function(){
    qProperties.close(); // This will open the task queue dialogue.
    console.log('task_queue_dialog -> task_queue_dialog.e2e.js');
  });
});

