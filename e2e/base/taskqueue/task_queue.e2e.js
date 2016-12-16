'use strict';

var helpers = require('../../common.js');
var qProperties = require('./task_queue_common.js'); // Defines task queue elements and common task queue related functions.

describe('task queue form test', function(){
  beforeAll(function(){
    helpers.login();
  });

  beforeEach(function(){
    qProperties.open(); // This will open the task queue dialogue.
  });

  /**
   * Iterates over all task queue tabs
   * The sequence is "pending" -> "failed" -> "finished".
   *
   * The following will be done in each tab:
   * 1. Checkout all default elements.
   * 2. Remove any tasks.
   * 3. Check the "no tasks available" message.
   */
  Object.keys(qProperties.dialog.tabs).forEach(function(tabName){ // => [pending, failed, finished]
    var tab = qProperties.dialog.tabs[tabName];
    var elements = tab.elements;

    // 1. Checkout all default elements.
    Object.keys(elements).forEach(function(elementName){
      it('should check if this element exists in the tab -> Element: "' + elementName + '", Tab: "' + tabName + '"', function(){
        qProperties.changeTab(tabName);
        expect(elements[elementName].isPresent()).toBe(true);
      });
    });

    // 2. Remove any tasks.
    it('should empty the tasks if any, in tab "' +  tabName + '"', function(){
      qProperties.changeTab(tabName);
      elements.listing.isDisplayed().then(function(displayed){
        if(displayed){ // If at least one task is there the listing is shown.
          qProperties.deleteTasks(tabName);
        }
      });
    });

    // 3. Check the "no tasks available" message.
    it('should have an empty task queue in tab "' + tabName + '"', function(){
      var noElements = elements.noElements;
      qProperties.changeTab(tabName);
      expect(elements.listing.isDisplayed()).toBe(false);
      expect(noElements.isDisplayed()).toBe(true);
      expect(noElements.getText()).toBe('There are no ' + tabName + ' Tasks.');
    });
  });

  /**
   * Iterates over all task queue tabs
   * The sequence is "pending" -> "failed" -> "finished".
   *
   * The following will be done in each tab:
   * 1. Let a task show up in the current tab.
   * 2. Checkout each column of the tab.
   * 3. Delete the task.
   */
  Object.keys(qProperties.dialog.tabs).forEach(function(tabName){ // => [pending, failed, finished]
    var tab = qProperties.dialog.tabs[tabName];
    var elements = tab.elements;

    // 1. Let a task show up in the current tab.
    it('should show task in tab "' + tabName + '"', function(){
      if(tabName === 'pending'){
        qProperties.createTask(500); // long living (~10 min)
      }else if(tabName === 'finished'){
        qProperties.createTask(1); // short living (~1 sec)
        browser.sleep(5000); // Should be done after the sleep
      }
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

    // 3. Delete the task.
    it('should delete the running task in tab "' + tabName + '"', function(){
      qProperties.changeTab(tabName);
      qProperties.deleteTasks(tabName, 'wait'); // Expects are included in the function.
    });
  });

  /**
   * This is a test for test cases that use the waitForPendingTasks function.
   */
  it('Tests the waiting for task function', function(){
    qProperties.createTask(5);
    qProperties.close(); // Because it's opened in beforeEach and in a normal case the task queue wouldn't be open.
    qProperties.waitForPendingTasks();
    qProperties.open(); // Opens the task queue again to confirm the result.
    expect(qProperties.dialog.tabs.pending.elements.tab.getText()).toBe('Pending (0)');
  });

  afterEach(function(){
    qProperties.close(); // This will close the task queue dialogue.
  });

  afterAll(function(){
    console.log('task_queue_form -> task_queue_form.e2e.js');
  });
});
