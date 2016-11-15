'use strict';

var helpers = require('../../common.js');
var taskQueueCommon = require('./task_queue_common.js');

describe('task queue form test', function(){
  var qProp = new taskQueueCommon();

  beforeAll(function(){
    helpers.login();
  });

  beforeEach(function(){
    qProp.taskQueue.click();
  });

  Object.keys(qProp.dialog.tabs).forEach(function(tabName){ // => [pending, failed, finished]
    var tab = qProp.dialog.tabs[tabName];
    var elements = tab.elements;

    Object.keys(elements).forEach(function(e){
      it('should check if the element exists in tab: ' + e + ' in ' + tabName, function(){
        qProp.changeTab(tabName);
        expect(elements[e].isPresent()).toBe(true);
      });
    });

    it('should empty the tasks if any tasks are in tab ' +  tabName, function(){
      qProp.changeTab(tabName);
      elements.listing.isDisplayed().then(function(displayed){
        if(displayed){
          qProp.deleteTasks(tabName);
        }
      });
    });

    it('should have an empty task queue in tab ' + tabName, function(){
      var noElements = elements.noElements;
      qProp.changeTab(tabName);
      expect(elements.listing.isDisplayed()).toBe(false);
      expect(noElements.isDisplayed()).toBe(true);
      expect(noElements.getText()).toBe('There are no ' + tabName + ' Tasks.');
    });
  });

  Object.keys(qProp.dialog.tabs).forEach(function(tabName){ // => [pending, failed, finished]
    var tab = qProp.dialog.tabs[tabName];
    var elements = tab.elements;
    it('should create a running task in tab ' + tabName, function(){
      if(tabName === 'pending'){
        qProp.createTask(500); // long living (~10 min)
      }else if(tabName === 'finished'){
        qProp.createTask(1); // short living (~1 sec)
        browser.sleep(5000);
      }
      qProp.changeTab(tabName);
      var listing = elements.listing;
      expect(listing.isDisplayed()).toBe(true);
    });

    Object.keys(tab.columns).forEach(function(col){
      var column = tab.columns[col];
      it('should display the following column in tab: ' + column.name + ' in ' + tabName, function(){
        qProp.changeTab(tabName);
        expect(column.element.isDisplayed()).toBe(true);
        expect(column.element.getText()).toBe(column.name);
      });
    });

    it('should delete the running task in pending tab', function(){
      qProp.changeTab(tabName);
      qProp.deleteTasks(tabName, 'wait');
    });
  });

  afterEach(function(){
    qProp.close();
  });

  afterAll(function(){
    console.log('task_queue_form -> task_queue_form.e2e.js');
  });
});
