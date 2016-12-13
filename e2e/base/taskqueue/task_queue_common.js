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
      pending: {
        name: 'Pending',
        elements: {},
        columns: {
          description: {
            name: 'Name'
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
    modalElements: {
      header: element(by.className('openattic-modal-header')),
      content: element(by.className('openattic-modal-content')),
      footer: element(by.className('openattic-modal-footer')),
      closeBtn: element(by.className('modal-close-btn'))
    },
    tabElements: { // is used to create elements for each tab (just for structure creation)
      tab: 'tc_tab_',
      deleteBtn: 'tc_task_delete_',
      loadingParagraph: 'tc_loading_',
      noElements: 'tc_no_elements_',
      listing: 'tc_listing_',
      selectAll: 'tc_select_all_'
    }
  };

  /**
   * Adds elements to each tab under dialog.tabs.
   * Uses dialog.tabElements to combine it with the tab names.
   * - Structure creation -
   */
  Object.keys(this.dialog.tabs).forEach(function(tab){
    Object.keys(self.dialog.tabElements).forEach(function(elementName){
      var className = self.dialog.tabElements[elementName] + tab;
      self.dialog.tabs[tab].elements[elementName] = element(by.className(className));
    });
    Object.keys(self.dialog.tabs[tab].columns).forEach(function(col){
      self.dialog.tabs[tab].columns[col].element = element(by.className('tc-col-' + tab + '-' + col));
    });
  });

  // Holds the different texts and needed elements.
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

  /**
   * Changes to the given tab.
   * @param {String} tab
   */
  this.changeTab = function(tab){
    Object.keys(self.dialog.modalElements).forEach(function(e){
      expect(self.dialog.modalElements[e].isDisplayed()).toBe(true);
      if(tab === 'pending'){ // Updates pending tab view.
        self.changeTab('failed');
      }
      element(by.className(self.dialog.tabElements.tab + tab)).click();
    });
  };

  /**
   * Opens the task queue dialog.
   */
  this.open = function(){
    self.taskQueue.click();
    Object.keys(self.dialog.modalElements).forEach(function(element){
      expect(self.dialog.modalElements[element].isPresent()).toBe(true);
    });
  };

  /**
   * Closes the task queue dialog.
   */
  this.close = function(){
    self.dialog.modalElements.closeBtn.click();
    Object.keys(self.dialog.modalElements).forEach(function(element){
      expect(self.dialog.modalElements[element].isPresent()).toBe(false);
    });
  };

  /**
   * Waits for all pending tasks to finish, use it with care because it's recursive.
   * @param {int} [depth] - Given by the recursive call.
   */
  this.waitForPendingTasks = function(depth){
    browser.sleep(helpers.configs.sleep);
    if(!depth){
      self.open();
      depth = 1;
    }else{
      self.changeTab('pending');
    }
    self.dialog.tabs.pending.elements.tab.getText().then(function(s){
      if(parseInt(s.match(/[0-9]+/)[0], 10) === 0){
        self.close();
      }else{
        self.waitForPendingTasks(depth + 1);
      }
    });
  };

  /**
   * Triggers an API-Call to create a test task with a specified time.
   * @param {int} time
   */
  this.createTask = function(time){
    browser.executeScript(function(time, configs){
      var xhr = new XMLHttpRequest();
      var url = configs.url.split('/');
      url = url[0] + '//' + configs.username + ':' + configs.password + '@' + url[2];
      xhr.open('post', url + '/openattic/api/taskqueue/test_task', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify({times: time}));
    }, time, helpers.configs);
    browser.sleep(helpers.configs.sleep);
  };

  /**
   * Deletes all or the given task name in the given tab.
   * @param {String} tab - Name of the tasks where the deletion takes place.
   * @param {String} [name] - Name of the task to delete.
   */
  this.deleteTasks = function(tab, name){
    var deleteBtn = self.dialog.tabs[tab].elements.deleteBtn;
    //expect(deleteBtn.isEnabled()).toBe(false);
    if(name){
      var task = element.all(by.cssContainingText('tr', name)).first();
      expect(task.isDisplayed()).toBe(true);
      task.click();
    }else{
      self.dialog.tabs[tab].elements.selectAll.click();
    }
    //expect(deleteBtn.isEnabled()).toBe(true);
    deleteBtn.click();
    self.handleDeleteForm(tab);
  };

  /**
   * Is used to determine if everything is alright while deleting.
   * You should't call this function from outside.
   * @param {String} tab - Name of the current tab.
   */
  this.handleDeleteForm = function(tab){
    var warning = self.deletionDialog.element.warning;
    var singleDelete = self.deletionDialog.element.singleDelete;
    var multiDelete = self.deletionDialog.element.multiDelete;
    var inputField = self.deletionDialog.element.inputField;
    var confirmBtn = self.deletionDialog.element.confirmBtn;
    expect(warning.isDisplayed()).toBe(tab === 'pending');
    if(tab === 'pending'){
      expect(warning.getText()).toBe(self.deletionDialog.text.warning);
    }
    multiDelete.isDisplayed().then(function(displayed){
      expect(singleDelete.isDisplayed()).toBe(!displayed);
    });
    expect(inputField.isDisplayed()).toBe(true);
    inputField.sendKeys('yes');
    expect(confirmBtn.isDisplayed()).toBe(true);
    expect(confirmBtn.getText()).toBe('Delete');
    confirmBtn.click();
  };
};

module.exports = taskQueueCommons;
