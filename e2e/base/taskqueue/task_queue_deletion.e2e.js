'use strict';

var helpers = require('../../common.js');
var qProperties = require('./task_queue_common.js'); // Defines task queue elements and common task queue related functions.

describe('task queue deletion pedning', function(){
  /**
   * Will create 2 tasks - keep them selected to prevent the UI to update the
   * selection. After they have already been finished, we then try to delete
   * them as they were pending tasks. Because they are finished we will be
   * presented with the moved deletion view. The UI tells us that they
   * weren't deleted because the were finished.
   */
  beforeAll(function(){
    helpers.login();
    element(by.css('.tc_menuitem_ceph_osds')).click();
    qProperties.deleteAllTasks();
    qProperties.createTask(5, 2); // short living ( < 30 sec)
    browser.sleep(helpers.configs.sleep);
    qProperties.open(); // This will open the task queue dialogue.
    qProperties.changeTab('pending');
  });

  it('should try to remove 2 finished tasks', function(){
    var task = element.all(by.cssContainingText('tr', 'wait')).first();
    task.click();
    browser.sleep(30000);
    task.click();
    var tabName = 'pending';
    qProperties.dialog.tabs[tabName].elements.selectAll.click();
    qProperties.dialog.tabs[tabName].elements.deleteBtn.click();
    qProperties.handleDeleteForm(tabName, 2);
  });

  /**
   * We expect 2 tasks to have a changed status, that's why they weren't
   * deleted and a displayed to us now.
   */
  it('should have 2 moved tasks', function(){
    expect($$('uib-accordion.tc-moved-tasks ul > li').count()).toBe(2);
  });

  /**
   * Will close the dialog via the close button.
   */
  it('should have a close button to close the dialog', function(){
    var closeButton = $('.tc-tab-del-close');
    expect(closeButton.isDisplayed()).toBe(true);
    closeButton.click();
  });

  /**
   * Will delete all finished tasks.
   */
  afterAll(function(){
    qProperties.deleteTasks('finished');
    qProperties.close(); // This will open the task queue dialogue.
    console.log('task_queue_deletion -> task_queue_deletion.e2e.js');
  });
});
