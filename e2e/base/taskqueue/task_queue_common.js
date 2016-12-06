'use strict';

var taskQueueCommons = function(){
  var self = this;
  var helpers = require('../../common.js');

  // Describes the dialog elements.
  this.taskQueue = element(by.className('tc_task-queue'));
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
    tabElements: {
      tab: 'tc_tab_',
      deleteBtn: 'tc_task_delete_',
      loadingParagraph: 'tc_loading_',
      noElements: 'tc_no_elements_',
      listing: 'tc_listing_',
      selectAll: 'tc_select_all_'
    }
  };

  Object.keys(this.dialog.tabs).forEach(function(tab){
    Object.keys(self.dialog.tabElements).forEach(function(e){
      var className = self.dialog.tabElements[e] + tab;
      self.dialog.tabs[tab].elements[e] = element(by.className(className));
    });
    Object.keys(self.dialog.tabs[tab].columns).forEach(function(col){
      self.dialog.tabs[tab].columns[col].element = element(by.className('tc-col-' + tab + '-' + col));
    });
  });

  this.deletionDialog = {
    text: {
      warning: 'Be aware that you could this task is running and that this will abort the execution without rolling ' +
        'back to a state before the execution was started. Be sure that you know what you do.',
      multiDel: 'You are about to delete multiple tasks.'
    },
    element: {
      warning: element(by.className('tc_run_warn')),
      singleDelete: element(by.className('tc_delete_one')),
      multiDelete: element(by.className('tc_delete_multiple')),
      inputField: element(by.model('input.enteredName')),
      confirmBtn: element(by.className('tc-tab-del-confirm'))
    }
  };

  this.changeTab = function(tab){
    Object.keys(self.dialog.modalElements).forEach(function(e){
      expect(self.dialog.modalElements[e].isDisplayed()).toBe(true);
      if(tab === 'pending'){ // Updates tab view.
        self.changeTab('failed');
      }
      element(by.className(self.dialog.tabElements.tab + tab)).click();
    });
  };

  this.open = function(){
    self.taskQueue.click();
    Object.keys(self.dialog.modalElements).forEach(function(element){
      expect(self.dialog.modalElements[element].isPresent()).toBe(true);
    });
  };

  this.close = function(){
    self.dialog.modalElements.closeBtn.click();
    Object.keys(self.dialog.modalElements).forEach(function(element){
      expect(self.dialog.modalElements[element].isPresent()).toBe(false);
    });
  };

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
