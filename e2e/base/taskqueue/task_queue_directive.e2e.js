'use strict';

var helpers = require('../../common.js');
var qProperties = require('./task_queue_common.js'); // Defines task queue elements and common task queue related functions.

describe('task queue directive test', function(){
  var sleeptime = 10000;
  /**
   * Validates the text of the task queue "button" in the header
   * and validates the lable of a specific panel.
   * Task-Queue has to be closed for this.
   */
  var validateTaskTabText = function(taskText, tabName){
    qProperties.validateTaskText(taskText);
    qProperties.validateDisplayedTab(tabName);
  };

  /**
   * Will clear all tasks if any.
   */
  beforeAll(function(){
    helpers.login();
    qProperties.deleteAllTasks();
  });

  it('Should display the Background-Tasks if empty', function(){
    qProperties.createTask(1); // short living (~1 sec)
    browser.sleep(sleeptime);
    validateTaskTabText('Background-Tasks', 'finished');
  });

  it('Should display the 1 Background-Task', function(){
    qProperties.createTask(500); // long living (~10 min)
    browser.sleep(sleeptime);
    validateTaskTabText('1 Background-Task', 'pending');
  });

  it('Should display the 2 Background-Tasks', function(){
    qProperties.createTask(500); // long living (~10 min)
    browser.sleep(sleeptime);
    validateTaskTabText('2 Background-Tasks', 'pending');
  });

  it('Should display the 1 Failed-Task', function(){
    qProperties.open();
    qProperties.deleteTasks('pending', 'wait');
    qProperties.close();
    browser.sleep(sleeptime);
    validateTaskTabText('1 Failed-Task', 'failed');
  });

  it('Should display the 2 Failed-Tasks', function(){
    qProperties.open();
    qProperties.deleteTasks('pending', 'wait');
    qProperties.close();
    browser.sleep(sleeptime);
    validateTaskTabText('2 Failed-Tasks', 'failed');
  });

  /**
   * This is a test for test cases that use the waitForPendingTasks function.
   */
  it('Tests the waiting for task function', function(){
    qProperties.createTask(5);
    qProperties.waitForPendingTasks();
    qProperties.validateTabName('pending', 'Pending (0)');
  });

  /**
   * Deletes all created tasks.
   */
  afterAll(function(){
    qProperties.deleteAllTasks();
    console.log('task_queue_directive -> task_queue_directive.e2e.js');
  });
});
