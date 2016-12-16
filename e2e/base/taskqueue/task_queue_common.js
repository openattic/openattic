'use strict';

/**
 * Defines task queue elements and common task queue related functions.
 *
 * Defines the following elements:
 * - taskQueue - element to click to open the dialogue.
 * - dialog.tabs - Holds the name, elements, column descriptions of each tab.
 * - dialog.modalElements - Holds the default elements that exist in all tabs.
 * - deletionDialog - Holds the different texts and needed elements.
 *
 * Defines the following common functions:
 * - changeTab(String tab) - Changes to the given tab.
 * - open() - Opens the task queue dialog.
 * - close() - Closes the task queue dialog.
 * - waitForPendingTasks() - Waits for all pending tasks to finish, use it with care because it's recursive.
 * - createTask(int time) - Triggers an API-Call to create a test task with a specified time.
 * - deleteTasks(String tab [, String name]) - Deletes all or the given task name in the given tab.
 */
var taskQueueCommons = function(){
  var self = this;
  var helpers = require('../../common.js');

  // The element to click to open the modal dialogue.
  this.taskQueue = element(by.className('tc_task-queue'));

  // Describes the dialog elements.
  this.dialog = {
    tabs: {
      pending: { // This is the same attribute key used by the UI.
        name: 'Pending',
        elements: {}, // Will be filled with protractor elements for each tab.
        columns: {
          description: { // This is the same attribute key that's used by the API-Object.
            name: 'Name'
            // 'element: protractorElement' will be inserted into each column.
          },
          created: {
            name: 'Created'
          },
          percent: {
            name: 'Complete'
          },
          approx: {
            name: 'Estimated'
          }
        }
      },
      failed: {
        name: 'Failed',
        elements: {},
        columns: {
          description: {
            name: 'Name'
          },
          created: {
            name: 'Created'
          },
          approx: {
            name: 'Runtime'
          },
          last_modified: {
            name: 'Failed'
          }
        }
      },
      finished: {
        name: 'Finished',
        elements: {},
        columns: {
          description: {
            name: 'Name'
          },
          created: {
            name: 'Created'
          },
          approx: {
            name: 'Runtime'
          },
          last_modified: {
            name: 'Finished'
          }
        }
      }
    },
    modalElements: { // Holds protractorElements.
      header: element(by.className('openattic-modal-header')),
      content: element(by.className('openattic-modal-content')),
      footer: element(by.className('openattic-modal-footer')),
      closeBtn: element(by.className('modal-close-btn'))
    },
    tabElements: { // This is used to create elements for each tab for structure creation. (Internal use)
      tab: 'tc_tab_',
      deleteBtn: 'tc_task_delete_',
      loadingParagraph: 'tc_loading_',
      noElements: 'tc_no_elements_',
      listing: 'tc_listing_',
      selectAll: 'tc_select_all_'
    }
  };

  /**
   * Adds elements to each tab.elements and adds an element to each column of the tab.
   * For internal use only.
   */
  Object.keys(this.dialog.tabs).forEach(function(tabName){
    var tabElements = self.dialog.tabElements;
    var tab = self.dialog.tabs[tabName];
    /**
     * Uses dialog.tabElements to combine it with the tab names to create the tab elements.
     */
    Object.keys(tabElements).forEach(function(elementName){
      var className = tabElements[elementName] + tabName;
      tab.elements[elementName] = element(by.className(className));
    });
    /**
     * Uses the attribute name of each column and tab name to create an column element.
     */
    Object.keys(tab.columns).forEach(function(columnName){
      tab.columns[columnName].element = element(by.className('tc-col-' + tabName + '-' + columnName));
    });
  });

  /**
   * Holds the different texts and needed elements of the deletion dialog.
   */
  this.deletionDialog = {
    text: {
      warning: 'If you delete running tasks, it will abort the execution and won\'t roll back what has been done ' +
        'so far!',
      multiDelete: 'You are about to delete multiple tasks.'
    },
    element: {
      warning: element(by.className('tc_run_warn')),
      singleDelete: element(by.className('tc_delete_one')),
      multiDelete: element(by.className('tc_delete_multiple')),
      inputField: element(by.model('input.enteredName')),
      confirmBtn: element(by.className('tc-tab-del-confirm'))
    }
  };

  /*
   * Expects default buttons to be displayed or not.
   * @param {Boolean} displayed - What to expect.
   */
  this.expectDefaultModalElements = function(displayed){
    var elements = self.dialog.modalElements;
    Object.keys(elements).forEach(function(elementName){
      var modalElement = elements[elementName];
      expect(modalElement.isPresent()).toBe(displayed);
      if(displayed){
        expect(modalElement.isDisplayed()).toBe(displayed);
      }
    });
  };

  /**
   * Changes to the given tab and expect default elements to be there.
   * @param {String} tabName
   */
  this.changeTab = function(tabName){
    if(tabName === 'pending'){ // Updates pending tab view.
      self.changeTab('failed');
    }
    element(by.className(self.dialog.tabElements.tab + tabName)).click();
    self.expectDefaultModalElements(true);
  };

  /**
   * Opens the task queue dialog and expect default elements to be there.
   */
  this.open = function(){
    self.taskQueue.click();
    self.expectDefaultModalElements(true);
  };

  /**
   * Closes the task queue dialog.
   */
  this.close = function(){
    self.dialog.modalElements.closeBtn.click();
    self.expectDefaultModalElements(false);
  };

  /**
   * Waits for all pending tasks to finish, use it with care because it's recursive.
   * @param {int} [depth] - Given by the recursive call.
   */
  this.waitForPendingTasks = function(depth){
    browser.sleep(helpers.configs.sleep);
    if(!depth){
      self.open(); // Opens the dialog at first call.
      depth = 1;
    }else{
      self.changeTab('pending'); // Updates the pending view.
    }
    self.dialog.tabs.pending.elements.tab.getText().then(function(s){
      if(parseInt(s.match(/[0-9]+/)[0], 10) === 0){
        self.close(); // Closes the dialog when there are zero pending tasks.
      }else{
        self.waitForPendingTasks(depth + 1); // Calls itself if there are pending tasks.
      }
    });
  };

  /**
   * Triggers an API-Call to create a test task with a specified time.
   * It executes an XMLHttpRequest to the api with the login data provided by configs.js.
   * @param {int} times - One round takes around 1 1/2 seconds.
   */
  this.createTask = function(times){
    browser.executeScript(function(times, configs){
      var xhr = new XMLHttpRequest();
      var url = configs.url.split('/');
      url = url[0] + '//' + configs.username + ':' + configs.password + '@' + url[2];
      xhr.open('post', url + '/openattic/api/taskqueue/test_task', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({times: times}));
    }, times, helpers.configs);
    browser.sleep(helpers.configs.sleep);
  };

  /**
   * Deletes all or the given task name in the given tab.
   * @param {String} tabName - Name of the tasks where the deletion takes place and which is displayed.
   * @param {String} [taskName] - Name of the task to delete.
   */
  this.deleteTasks = function(tabName, taskName){
    var deleteBtn = self.dialog.tabs[tabName].elements.deleteBtn;
    expect(deleteBtn.isEnabled()).toBe(false);
    if(taskName){ // If a singel deletion takes place.
      var task = element.all(by.cssContainingText('tr', taskName)).first();
      expect(task.isDisplayed()).toBe(true);
      task.click();
    }else{ // Delete all tasks in the tabName.
      self.dialog.tabs[tabName].elements.selectAll.click();
    }
    expect(deleteBtn.isEnabled()).toBe(true);
    deleteBtn.click();
    self.handleDeleteForm(tabName);
  };

  /**
   * Is used to determine if everything is alright while deleting.
   * You should't call this function from outside.
   * @param {String} tab - Name of the current tab.
   */
  this.handleDeleteForm = function(tab){
    var dialog = self.deletionDialog;
    var elements = dialog.element;
    var warning = elements.warning;
    var singleDelete = elements.singleDelete;
    var multiDelete = elements.multiDelete;
    var inputField = elements.inputField;
    var confirmBtn = elements.confirmBtn;
    var showWarning = tab === 'pending';
    expect(warning.isDisplayed()).toBe(showWarning); // Should only show the warning if you want to delete a pending task.
    if(showWarning){
      expect(warning.getText()).toBe(dialog.text.warning);
    }
    multiDelete.isDisplayed().then(function(displayed){ // If you delete multiple tasks you the single deletion can't be shown and vice versa.
      expect(singleDelete.isDisplayed()).toBe(!displayed);
    });
    expect(inputField.isDisplayed()).toBe(true);
    inputField.sendKeys('yes');
    expect(confirmBtn.isDisplayed()).toBe(true);
    expect(confirmBtn.getText()).toBe('Delete');
    confirmBtn.click();
    browser.sleep(helpers.configs.sleep);
  };
};

module.exports = taskQueueCommons;
