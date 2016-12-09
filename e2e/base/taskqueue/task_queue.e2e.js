'use strict';

var helpers = require('../../common.js');
var taskQueueCommon = require('./task_queue_common.js');

describe('task queue form test', function(){
  var qProperties = new taskQueueCommon();

  beforeAll(function(){
    helpers.login();
  });

  beforeEach(function(){
    qProperties.open();
  });

  Object.keys(qProperties.dialog.tabs).forEach(function(tabName){ // => [pending, failed, finished]
    var tab = qProperties.dialog.tabs[tabName];
    var elements = tab.elements;

    Object.keys(elements).forEach(function(e){
      it('should check if the element exists in tab: ' + e + ' in ' + tabName, function(){
        qProperties.changeTab(tabName);
        expect(elements[e].isPresent()).toBe(true);
      });
    });

    it('should empty the tasks if any tasks are in tab ' +  tabName, function(){
      qProperties.changeTab(tabName);
      elements.listing.isDisplayed().then(function(displayed){
        if(displayed){
          qProperties.deleteTasks(tabName);
        }
      });
    });

    it('should have an empty task queue in tab ' + tabName, function(){
      var noElements = elements.noElements;
      qProperties.changeTab(tabName);
      expect(elements.listing.isDisplayed()).toBe(false);
      expect(noElements.isDisplayed()).toBe(true);
      expect(noElements.getText()).toBe('There are no ' + tabName + ' Tasks.');
    });
  });

  Object.keys(qProperties.dialog.tabs).forEach(function(tabName){ // => [pending, failed, finished]
    var tab = qProperties.dialog.tabs[tabName];
    var elements = tab.elements;
    it('should create a running task in tab ' + tabName, function(){
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

    Object.keys(tab.columns).forEach(function(col){
      var column = tab.columns[col];
      it('should display the following column in tab: ' + column.name + ' in ' + tabName, function(){
        qProperties.changeTab(tabName);
        expect(column.element.isDisplayed()).toBe(true);
        expect(column.element.getText()).toBe(column.name);
      });
    });

    it('should delete the running task in pending tab', function(){
      qProperties.changeTab(tabName);
      qProperties.deleteTasks(tabName, 'wait');
    });
  });

  it('Tests the waiting for task function', function(){
    qProperties.createTask(5);
    qProperties.close();
    qProperties.waitForPendingTasks();
    qProperties.open();
    expect(qProperties.dialog.tabs.pending.elements.tab.getText()).toBe('Pending (0)');
  });

  afterEach(function(){
    qProperties.close();
  });

  afterAll(function(){
    console.log('task_queue_form -> task_queue_form.e2e.js');
  });
});
