'use strict';

var helpers = require('../../common.js');
var taskQueueCommon = require('./task_queue_common.js');

describe('task queue form test', function(){
  // Defines task queue elements and common task queue related functions.
  var qProperties = new taskQueueCommon();

  beforeAll(function(){
    helpers.login();
  });

  beforeEach(function(){
    // This will open the task queue dialogue.
    qProperties.open();
  });

  /**
   * Iterates over all task queue tabs
   * The sequence is "pending" -> "failed" -> "finished".
   *
   * The following will be done in each tab:
   * 1. Checkout all default elements.
   * 2. Remove any tasks.
   * 3. Check the no tasks available message.
   */
  Object.keys(qProperties.dialog.tabs).forEach(function(tabName){ // => [pending, failed, finished]
    var tab = qProperties.dialog.tabs[tabName];
    var elements = tab.elements;

    // 1. Checkout all default elements.
    Object.keys(elements).forEach(function(e){
      it('should check if the element exists in tab: ' + e + ' in ' + tabName, function(){
        qProperties.changeTab(tabName);
        expect(elements[e].isPresent()).toBe(true);
      });
    });

    // 2. Remove any tasks.
    it('should empty the tasks if any tasks are in tab ' +  tabName, function(){
      qProperties.changeTab(tabName);
      elements.listing.isDisplayed().then(function(displayed){
        if(displayed){
          qProperties.deleteTasks(tabName);
        }
      });
    });

    // 3. Check the no tasks available message.
    it('should have an empty task queue in tab ' + tabName, function(){
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
    it('should show task in tab ' + tabName, function(){
      if(tabName === 'pending'){
        qProperties.createTask(500); // long living (~10 min)
      }else if(tabName === 'finished'){
        qProperties.createTask(1); // short living (~1 sec)
        browser.sleep(5000);
      }
      qProperties.changeTab(tabName);
      var listing = elements.listing;
      expect(listing.isDisplayed()).toBe(true);
    });

    // 2. Checkout each column of the tab.
    Object.keys(tab.columns).forEach(function(col){
      var column = tab.columns[col];
      it('should display the following column in tab: ' + column.name + ' in ' + tabName, function(){
        qProperties.changeTab(tabName);
        expect(column.element.isDisplayed()).toBe(true);
        expect(column.element.getText()).toBe(column.name);
      });
    });

    // 3. Delete the task.
    it('should delete the running task in pending tab', function(){
      qProperties.changeTab(tabName);
      qProperties.deleteTasks(tabName, 'wait');
    });
  });

  /**
   * This is a test for test cases that use the waitForPendingTasks function.
   */
  it('Tests the waiting for task function', function(){
    qProperties.createTask(5);
    qProperties.close();
    qProperties.waitForPendingTasks();
    qProperties.open();
    expect(qProperties.dialog.tabs.pending.elements.tab.getText()).toBe('Pending (0)');
  });

  afterEach(function(){
    // This will close the task queue dialogue.
    qProperties.close();
  });

  afterAll(function(){
    console.log('task_queue_form -> task_queue_form.e2e.js');
  });
});
