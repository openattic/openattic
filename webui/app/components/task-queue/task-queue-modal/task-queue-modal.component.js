/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2016 SUSE LLC
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * This package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
"use strict";

import globalConfig from "globalConfig";
import _ from "lodash";

class TaskQueueModalComponent {
  constructor ($scope, $filter, $uibModal, taskQueueFetcher) {
    this.$scope = $scope;
    this.$filter = $filter;
    this.taskQueueFetcher = taskQueueFetcher;
    this.$uibModal = $uibModal;

    this.refresh = true; // Will prevent auto refreshing if set to false.

    /* Variables for every tab. */
    this.pageSize = 50;

    this.search = "";
    this.searchModelOptions = {
      updateOn: "default blur",
      debounce: {
        "default": 500,
        "blur": 0
      }
    };

    /**
   * Describes and configures all displayed tabs and tables.
   */
    const defaultTab = {
      name: null,
      data: [],
      workingData: [],
      page: {
        current: 0,
        last: null,
        firstItem: 1,
        lastItem: null,
        itemLength: 0
      },
      pageData: [],
      states: null,
      count: -1,
      loaded: false,
      tableSort: {
        attribute: null,
        reverse: true
      },
      selection: {
        item: null,
        items: [],
        checkAll: false
      },
      tableColumns: []
    };
    this.tabs = {
      pending: _.extend({}, _.cloneDeep(defaultTab), {
        name: "Pending",
        states: ["Running", "Not Started"],
        tableSort: {
          attribute: "percent",
          reverse: true
        },
        tableColumns: [
          {
            name: "Name",
            attribute: "description",
            type: "text"
          },
          {
            name: "Created",
            attribute: "created",
            type: "date"
          },
          {
            name: "Complete",
            attribute: "percent",
            type: "percent"
          },
          {
            name: "Estimated",
            attribute: "approx",
            displayAttr: "approxFormat",
            type: "text"
          }
        ]
      }),
      failed: _.extend({}, _.cloneDeep(defaultTab), {
        name: "Failed",
        states: ["Exception", "Aborted"],
        tableSort: {
          attribute: "last_modified",
          reverse: true
        },
        tableColumns: [
          {
            name: "Name",
            type: "text",
            attribute: "description"
          },
          {
            name: "Reason",
            type: "text",
            attribute: "status"
          },
          {
            name: "Created",
            type: "date",
            attribute: "created"
          },
          {
            name: "Runtime",
            attribute: "approx",
            displayAttr: "approxFormat",
            type: "date"
          },
          {
            name: "Failed",
            type: "date",
            attribute: "last_modified"
          }
        ]
      }),
      finished: _.extend({}, _.cloneDeep(defaultTab), {
        name: "Finished",
        states: ["Finished"],
        tableSort: {
          attribute: "last_modified",
          reverse: true
        },
        tableColumns: [
          {
            name: "Name",
            type: "text",
            attribute: "description"
          },
          {
            name: "Created",
            type: "date",
            attribute: "created"
          },
          {
            name: "Runtime",
            attribute: "approx",
            displayAttr: "approxFormat",
            type: "date"
          },
          {
            name: "Finished",
            type: "date",
            attribute: "last_modified"
          }
        ]
      })
    };

    this.firstLoad = true; // Needed to select a tab after the first load.

    /**
   * Triggers instant table update on tab change.
   */
    this.$scope.$watch("modalTabData.active", (tabNew, tabOld) => {
      if (tabOld !== null && tabNew !== null) {
        this.loadAllTabs(true);
      }
    });

    /**
   * Adds a watch for each tab to watch it's page number, in order to change the
   * page if it does.
   */
    _.forIn(this.tabs, (tab, key) => {
      this.$scope.$watch("tabs." + key + ".page.current", (pgNr) => {
        this.tabs[key].page.current = pgNr;
        this.pageChange();
      });
    });

    /**
   * Triggers instant table update when the modal dialog is fully opened..
   */
    this.modalInstance.opened.then(() => {
      this.loadAllTabs();
    });

    /**
   * Cancels any refresh call, when the dialog is closed.
   */
    this.modalInstance.closed.then(() => {
      clearInterval(this.timeout);
    });
  }

  $onInit () {
    this.taskQueueFetcher.setOnUpdateChange((update, prev) => {
      this.onUpdateChange(update, prev);
    });
  }

  /**
   * Watches if the task queue fetcher is doing an update and it will select
   * the tab with the highest priority after the first load.
   */
  onUpdateChange (update, prev) {
    this.update = update;
    if (prev && !update && this.firstLoad && this.modalTabData) {
      this.firstLoad = false;
      this.selectUrgentTab();
    }
  }

  /**
   * Returns the data of the active tab.
   * @returns {object} - Data of active tab.
   */
  getActiveTab () {
    return this.tabs[Object.keys(this.tabs)[this.modalTabData ? this.modalTabData.active : 0]];
  }

  /**
   * This will search and sort the tasks in a tab and set the current available
   * tasks for the tab.
   * After that it will update the selection and update or change the page.
   * @param {object} [tab] - Set the page content of this tab object.
   * @returns {object} the current or the given tab.
   */
  updateWorkingData (tab) {
    tab = tab || this.getActiveTab();
    let search = this.search.toLowerCase();
    tab.workingData = search === "" ? tab.data : tab.data.filter((e) => {
      return e.description.toLowerCase().match(search);
    });
    tab.workingData = this.$filter("orderBy")(tab.workingData, [
      (tab.tableSort.reverse ? "-" : "+") + tab.tableSort.attribute,
      "-last_modified"
    ]);
    return this.pageChange(this.updateCompleteSelection(tab));
  }

  /**
   * Sets all page content of the table.
   * The page content is retrieved by slicing it out of the workingData.
   * The needed pagination values are retrieved out of the workingData in
   * combination with the current page number and the entry size of each page.
   * @param {object} [tab] - Set the page content of this tab object.
   * @returns {object} the current or the given tab.
   */
  pageChange (tab) {
    tab = tab || this.getActiveTab();
    let page = tab.page;
    let pgSize = this.pageSize;
    page.itemLength = tab.workingData.length;
    page.last = Math.ceil(page.itemLength / pgSize, 0) || 1;
    page.firstItem = pgSize * page.current;
    page.lastItem = pgSize * (page.current + 1);
    if (page.lastItem > page.itemLength) {
      page.lastItem = page.itemLength;
    }
    tab.pageData = tab.workingData.slice(page.firstItem, page.lastItem);
    return tab;
  }

  /**
   * Updates the entry size of each page and the current page in the current tab.
   * After that it will update the page, through a page change.
   * @param {number} size - Sets the new entry size.
   */
  updateEntries (size) {
    this.pageSize = size;
    let tab = this.getActiveTab();
    tab.page.current = Math.ceil((tab.page.firstItem + 1) / size, 0);
    this.pageChange(tab);
  }

  /**
   * Updates the search value of each page, the search value will search
   * through the description of each task in the current tab.
   * After that it will update the working data.
   * @param {number} size - Sets the new entry size.
   */
  searchDescriptions (search) {
    this.search = search;
    this.updateWorkingData();
  }

  /**
   * Sets the new sorting attribute or changes the order of it if it's already
   * set.
   * After that it will update the working data.
   * @param {String} attribute
   */
  order (attribute) {
    let tab = this.getActiveTab();
    if (tab.tableSort.attribute === attribute) {
      tab.tableSort.reverse = !tab.tableSort.reverse;
    }
    tab.tableSort.attribute = attribute;
    this.updateWorkingData(tab);
  }

  /**
   * Sets the sorting classes of the attribute that the table is sorted by.
   * @param {String} attribute
   * @returns {string} - A string with the classes to set.
   */
  orderClass (attribute) {
    let tab = this.getActiveTab();
    let cssClass = "sorting";
    if (tab.tableSort.attribute === attribute) {
      cssClass = tab.tableSort.reverse ? "sorting_desc" : "sorting_asc";
    }
    return cssClass;
  }

  /**
   * Returns column data of a row. The attribute name can differ.
   * @param {object} attr
   * @param {object} data
   * @returns {*}
   */
  getColumnData (attr, data) {
    let attribute = attr.displayAttr || attr.attribute;
    return data[attribute];
  }

  /**
   * Checks if a specific row is selected or not.
   * @param {object} task
   * @returns {boolean} State of the selection.
   */
  isTaskSelected (task) {
    let tab = this.getActiveTab();
    return tab.selection.items.indexOf(task.id) !== -1;
  }

  /**
   * Filters the selection, if all selected tasks are still available.
   * with the left over selection and the given tab, the selection will be
   * updated and refreshed.
   * @param {object} tab
   * @returns {object} Updated tab object.
   */
  updateCompleteSelection (tab) {
    let data = tab.workingData.map(this.getTaskId);
    let selection = tab.selection.items.filter((id) => {
      return data.indexOf(id) !== -1;
    });
    return this.updateSelectedTasks(tab, selection);
  }

  /**
   * Returns the id of a task.
   * @param {object} task
   * @return {number} Id of task.
   */
  getTaskId (task) {
    return task.id;
  }

  /**
   * Refreshes and updates the selection in the given tab with the given selection.
   * It will also validate if the check all checkbox has to be activated.
   * @param {object} tab
   * @param {numbers[]} selection
   * @returns {object} Updated tab object.
   */
  updateSelectedTasks (tab, selection) {
    tab.selection.checkAll = selection.length === tab.workingData.length;
    tab.selection.item = selection.length === 1 ? this.getTaskFromId(tab, selection[0]) : null;
    tab.selection.items = selection;
    tab.loaded = true;
    return tab;
  }

  /**
   * Updates the selection in letious ways.
   * It deselects from selection, appends to selection and sets a new selection.
   * Multiple selections can be achieved by holding down shift on your click on
   * a row or append tasks separately by holding ctrl down while clicking on a
   * row or trough clicking into a checkbox. You can remove selections the same
   * way the difference is that holding ctrl down isn't necessary, while
   * clicking on a selected row
   * @param {object} task
   * @param {event} $event
   */
  toggleTaskSelection (task, $event) {
    let tab = this.getActiveTab();
    let items = tab.selection.items;
    let exists = items.indexOf(task.id);
    let sorted = [];
    let iPrev = 0;
    let iNow = 0;
    let newItems = [];
    if (!$event.shiftKey) {
      if (exists !== -1) {
        items.splice(exists, 1);
      } else if ($event.ctrlKey || $event.target.tagName === "INPUT") {
        items.push(task.id);
      } else {
        items = [task.id];
      }
    } else {
      sorted = _.cloneDeep(tab.workingData).map(this.getTaskId);
      iPrev = sorted.indexOf(items[items.length - 1]);
      iNow = sorted.indexOf(task.id);
      newItems = iPrev < iNow ? sorted.slice(iPrev + 1, iNow + 1) : sorted.slice(iNow, iPrev);
      newItems.forEach((id) => {
        exists = items.indexOf(id);
        if (exists !== -1) {
          items.splice(exists, 1);
        } else {
          items.push(id);
        }
      });
    }
    this.updateSelectedTasks(tab, items);
  }

  /**
   * Select all task in the table or none depends of what state is checked.
   */
  checkAllTasks () {
    let tab = this.getActiveTab();
    tab.selection.items = tab.selection.checkAll ?
      tab.workingData.map(this.getTaskId) : [];
  }

  /**
   * Closes the task queue modal dialog.
   */
  closeTaskQueue () {
    this.modalInstance.dismiss("close");
  }

  /**
   * Counts all tasks in the tabs and adds all tasks to the active tab.
   * @param {String} tabKey - Attribute of the tab.
   * @param {object} allTasks - Holds all old and new tasks.
   */
  loadTabTasks (tabKey, allTasks) {
    let tasks = allTasks.tasks;
    let tab = this.tabs[tabKey];
    let activeTab = this.modalTabData && tabKey === Object.keys(this.tabs)[this.modalTabData.active];
    tab.tempCount = 0;
    tab.tempData = [];
    tab.states.forEach((state) => {
      let current = tasks[state];
      tab.tempCount += current.length;
      if (activeTab) {
        if (state === "Running") {
          current.forEach(this.calcApprox, this);
        } else if (["Exception", "Aborted", "Finished"].indexOf(state) !== -1) {
          current.forEach(this.calcRuntime, this);
        }
        tab.tempData = tab.tempData.concat(current);
      }
    });
    tab.count = tab.tempCount;
    if (activeTab) {
      tab.data = tab.tempData;
      this.tabs[tabKey] = this.updateWorkingData(tab);
    }
    this.tabs[tabKey] = tab;
    this.reloadTaskIn(globalConfig.GUI.defaultTaskReloadTime);
  }

  /**
   * Calculates the time between to dates, with different preciseness.
   * @param {Date} first - The older Date.
   * @param {Date} last - The newer Date.
   * @param {boolean} precise - Should the calculation be precise?
   * @return {Object[]} - Diff Date and time String.
   */
  timeBetween (first, last, precise) {
    let approx = new Date(last.getTime() - first.getTime());
    let days = approx.getDate() - 1;
    let h = approx.getHours() - 1;
    let m = approx.getMinutes();
    let approxFormat = (days > 0) ? days + "d " : "";
    approxFormat += (h > 0) ? h + "h " : "";
    if (!precise) {
      approxFormat += (approxFormat !== "" || m > 0) ? m + "m" : "< 1m";
    } else {
      approxFormat += (m > 0) ? m + "m " : "";
      let s = approx.getSeconds();
      approxFormat += (s > 0) ? s + "s" : "";
    }
    return {
      approx: approx,
      approxFormat: approxFormat
    };
  }

  /**
   * Appends the calculation of the precise runtime to a finished or failed task.
   * @param {Object} task
   * @param {Number} index
   * @param {[]} arr
   */
  calcRuntime (task, index, arr) {
    task.created = new Date(task.created);
    task.last_modified = new Date(task.last_modified);
    arr[index] = _.merge({}, task, this.timeBetween(task.created, task.last_modified, true));
  }

  /**
   * Appends the calculation of the estimated left runtime to a running task.
   * @param {Object} task
   * @param {Number} index
   * @param {[]} arr
   */
  calcApprox (task, index, arr) {
    if (task.estimated !== null) {
      task.last_modified = new Date(task.last_modified);
      task.estimated = new Date(task.estimated);
      arr[index] = _.merge({}, task, this.timeBetween(task.last_modified, task.estimated));
    } else {
      task.approxFormat = "NA";
    }
  }

  /**
   * Gets task object to the given id.
   * @param {Object} tab - Active tab data.
   * @param {Number} id - Task id.
   * @return {Object} Task object.
   */
  getTaskFromId (tab, id) {
    return tab.data.filter((item) => {
      return item.id === id;
    })[0];
  }

  /**
   * Opens a modal dialog to delete the selected tasks.
   * Stops refresh till the dialog closes.
   */
  taskDeleteAction () {
    let tab = this.getActiveTab();
    let items = tab.selection.items;
    let modalInstance = {};
    if (items.length === 0) {
      return;
    }
    modalInstance = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "taskQueueDeleteModalComponent",
      resolve: {
        taskSelection: () => {
          return items.map((id) => {
            return this.getTaskFromId(tab, id);
          });
        }
      }
    });
    modalInstance.opened.then(() => {
      this.refresh = false;
      clearInterval(this.timeout);
    });
    modalInstance.closed.then(() => {
      this.refresh = true;
      this.loadAllTabs(true);
    });
  }

  /**
   * Triggers a refresh over all tabs, but only if there are no pending requests
   * and no selection of a task.
   * @param {Boolean} force - If set a reload will be forced even if there is a
   *   selection.
   */
  loadAllTabs (force) {
    let tab = this.getActiveTab();
    let items = tab.selection.items;
    if (!this.refresh || !force && items.length > 0) {
      this.reloadTaskIn(globalConfig.GUI.defaultTaskReloadTime);
      return;
    }
    this.taskQueueFetcher.loadOverview().then((allTasks) => {
      Object.keys(this.tabs).forEach((tabKey) => {
        this.loadTabTasks(tabKey, allTasks);
      });
    });
  }

  /**
   * Selects the tab with tasks and the highest priority.
   * This function will only called once.
   * Priority:
   * 1. Failed
   * 2. Pending
   * 3. Finished
   */
  selectUrgentTab () {
    let setActive = 0;
    if (this.tabs.failed.count > 0) {
      setActive = 1;
    } else if (this.tabs.pending.count === 0 &&
        this.tabs.finished.count > 0) {
      setActive = 2;
    }
    this.modalTabData.active = setActive;
  }

  /**
   * Stops old timeout if any and sets a new time out which will be triggered
   * in "time" seconds.
   * @param {Number} time - Number represents seconds.
   */
  reloadTaskIn (time) {
    if (this.timeout) {
      clearInterval(this.timeout);
    }
    this.timeout = setTimeout(() => {
      this.loadAllTabs();
    }, time);
  }
}

export default {
  template: require("./task-queue-modal.component.html"),
  controller: TaskQueueModalComponent,
  bindings: {
    modalInstance: "<",
    resolve: "<"
  }
};
