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

var app = angular.module("openattic.taskQueue");
app.controller("TaskQueueModalCtrl", function ($scope, $uibModalInstance, toasty, $state, $filter,
    taskQueueService, $uibModal, $interval, taskQueueFetcher) {
  /**
   * Describes and configures all displayed tabs and tables.
   */
  var defaultTab = {
    name: null,
    data: [],
    page: 1,
    pageData: [],
    states: null,
    count: null,
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
  $scope.tabs = {
    pending: angular.extend({}, defaultTab, {
      name: "Pending",
      states: ["Running", "Not Started"],
      tableSort: {
        attribute: "percent"
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
    failed: angular.extend({}, defaultTab, {
      name: "Failed",
      states: ["Exception", "Aborted"],
      tableSort: {
        attribute: "last_modified"
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
          name: "Failed",
          type: "date",
          attribute: "last_modified"
        }
      ]
    }),
    finished: angular.extend({}, defaultTab, {
      name: "Finished",
      states: ["Finished"],
      tableSort: {
        attribute: "last_modified"
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

  $scope.pageSize = 50;

  /**
   * Returns the data of the active tab.
   * @returns {object} - Data of active tab.
   */
  $scope.getActiveTab = function () {
    return $scope.tabs[Object.keys($scope.tabs)[$scope.modalTabData ? $scope.modalTabData.active : 0]];
  };

  /**
   * Will slice out the right ordered data to set the page content of the table.
   * @param {object} [tab] - Set the page content of this tab object.
   * @returns {object} the current or the given tab.
   */
  $scope.pageChange = function (tab) {
    tab = tab ? tab : $scope.getActiveTab();
    var pgNr = tab.page;
    var pgSize = $scope.pageSize;
    tab.data = $filter("orderBy")(tab.data, [
      (tab.tableSort.reverse ? "-" : "+") + tab.tableSort.attribute,
      "-last_modified"
    ]);
    tab.pageData = tab.data.slice((pgNr - 1) * pgSize, pgNr * pgSize);
    return tab;
  };

  /**
   * Sets the new sorting attribute and change the order if the attribute is already set.
   * @param {String} attribute
   */
  $scope.order = function (attribute) {
    var tab = $scope.getActiveTab();
    if (tab.tableSort.attribute === attribute) {
      tab.tableSort.reverse = !tab.tableSort.reverse;
    }
    tab.tableSort.attribute = attribute;
    $scope.pageChange();
  };

  /**
   * Sets the sorting classes of the attribute that the table is sorted by.
   * @param {String} attribute
   * @returns {string} - A string with the classes to set.
   */
  $scope.orderClass = function (attribute) {
    var tab = $scope.getActiveTab();
    var cssClass = "sorting";
    if (tab.tableSort.attribute === attribute) {
      cssClass = tab.tableSort.reverse ? "sorting_desc" : "sorting_asc";
    }
    return cssClass;
  };

  /**
   * Returns column data of a row. The attribute name can differ.
   * @param {object} attr
   * @param {object} data
   * @returns {*}
   */
  $scope.getColumnData = function (attr, data) {
    var attribute = attr.displayAttr || attr.attribute;
    return data[attribute];
  };

  /**
   * Checks if a specific row is selected or not.
   * @param {object} row
   * @returns {boolean} State of the selection.
   */
  $scope.isTaskSelected = function (row) {
    var tab = $scope.getActiveTab();
    return tab.selection.items.indexOf(row.id) !== -1;
  };

  /**
   * Refreshes and updates the selection while a table refresh takes place.
   * @param {object} tab
   * @returns {object} Updated tab object.
   */
  $scope.updateCompleteSelection = function (tab) {
    var data = tab.data.map($scope.getTaskId);
    var selection = tab.selection.items.filter(function (id) {
      return data.indexOf(id) !== -1;
    });
    return $scope.updateSelectedTasks($scope.pageChange(tab), selection);
  };

  /**
   * Returns the id of a task.
   * @param {object} task
   * @return {number} Id of task.
   */
  $scope.getTaskId = function (task) {
    return task.id;
  };

  /**
   * Refreshes and updates the selection.
   * @param {object} tab
   * @param {numbers[]} selection
   * @returns {object} Updated tab object.
   */
  $scope.updateSelectedTasks = function (tab, selection) {
    tab.selection.checkAll = selection.length === tab.data.length;
    tab.selection.item = selection.length === 1 ? $scope.getTaskFromId(tab, selection[0]) : null;
    tab.selection.items = selection;
    tab.loaded = true;
    return tab;
  };

  /**
   * Updates the selection in various ways.
   * It deselects from selection, appends to selection and sets a new selection.
   * You can do multiple selections by holding down shift on your click on a row.
   * You can append or remove a selection by holding ctrl down while clicking.
   * @param {object} task
   * @param {event} $event
   */
  $scope.toggleTaskSelection = function (task, $event) {
    var tab = $scope.getActiveTab();
    var items = tab.selection.items;
    var exists = items.indexOf(task.id);
    var sorted = [];
    var iPrev = 0;
    var iNow = 0;
    var newItems = [];
    if (!$event.shiftKey) {
      if (exists !== -1) {
        items.splice(exists, 1);
      } else if ($event.ctrlKey) {
        items.push(task.id);
      } else {
        items = [task.id];
      }
    } else {
      sorted = $filter("orderBy")(tab.data, tab.tableSort.attribute, tab.tableSort.reverse);
      sorted = sorted.map($scope.getTaskId);
      iPrev = sorted.indexOf(items[items.length - 1]);
      iNow = sorted.indexOf(task.id);
      newItems = iPrev < iNow ? sorted.slice(iPrev + 1, iNow + 1) : sorted.slice(iNow, iPrev);
      newItems.forEach(function (id) {
        exists = items.indexOf(id);
        if (exists !== -1) {
          items.splice(exists, 1);
        } else {
          items.push(id);
        }
      });
    }
    $scope.updateSelectedTasks(tab, items);
  };

  /**
   * Select all task in the table or none depends of what state is checked.
   */
  $scope.checkAllTasks = function () {
    var tab = $scope.getActiveTab();
    tab.selection.items = tab.selection.checkAll ?
      tab.data.map($scope.getTaskId) : [];
  };

  /**
   * Closes the task queue modal dialog.
   */
  $scope.closeTaskQueue = function () {
    $uibModalInstance.dismiss("close");
  };

  /**
   * Counts all tasks in the tabs and adds all tasks to the active tab.
   * @param {String} tabKey - Attribute of the tab.
   * @param {object} allTasks - Holds all old and new tasks.
   */
  $scope.loadTabTasks = function (tabKey, allTasks) {
    var tasks = allTasks.tasks;
    var tab = $scope.tabs[tabKey];
    var activeTab = $scope.modalTabData && tabKey === Object.keys($scope.tabs)[$scope.modalTabData.active];
    tab.tempCount = 0;
    tab.tempData = [];
    tab.states.forEach(function (state) {
      var current = tasks[state];
      tab.tempCount += current.length;
      if (activeTab) {
        if (state === "Running") {
          current.forEach($scope.calcApprox);
        } else if (["Exception", "Aborted", "Finished"].indexOf(state) !== -1) {
          current.forEach($scope.calcRuntime);
        }
        tab.tempData = tab.tempData.concat(current);
      }
    });
    tab.count = tab.tempCount;
    if (activeTab) {
      tab.data = tab.tempData;
      $scope.tabs[tabKey] = $scope.updateCompleteSelection(tab);
    }
    $scope.tabs[tabKey] = tab;
    $scope.reloadTaskIn(globalConfig.GUI.defaultTaskReloadTime);
  };

  /**
   * Calculates the time between to dates, with different preciseness.
   * @param {Date} first - The older Date.
   * @param {Date} last - The newer Date.
   * @param {boolean} precise - Should the calculation be precise?
   * @return {Object[]} - Diff Date and time String.
   */
  $scope.timeBetween = function (first, last, precise) {
    var approx = new Date(last.getTime() - first.getTime());
    var days = approx.getDate() - 1;
    var h = approx.getHours() - 1;
    var m = approx.getMinutes();
    var approxFormat = (days > 0) ? days + "d " : "";
    approxFormat += (h > 0) ? h + "h " : "";
    if (!precise) {
      approxFormat += (approxFormat !== "" || m > 0) ? m + "m" : "< 1m";
    } else {
      approxFormat += (m > 0) ? m + "m " : "";
      var s = approx.getSeconds();
      approxFormat += (s > 0) ? s + "s" : "";
    }
    return {
      approx: approx,
      approxFormat: approxFormat
    };
  };

  /**
   * Appends the calculation of the precise runtime to a finished or failed task.
   * @param {Object} task
   * @param {Number} index
   * @param {[]} arr
   */
  $scope.calcRuntime = function (task, index, arr) {
    task.created = new Date(task.created);
    task.last_modified = new Date(task.last_modified);
    arr[index] = angular.merge({}, task, $scope.timeBetween(task.created, task.last_modified, true));
  };

  /**
   * Appends the calculation of the estimated left runtime to a running task.
   * @param {Object} task
   * @param {Number} index
   * @param {[]} arr
   */
  $scope.calcApprox = function (task, index, arr) {
    if (task.estimated !== null) {
      task.last_modified = new Date(task.last_modified);
      task.estimated = new Date(task.estimated);
      arr[index] = angular.merge({}, task, $scope.timeBetween(task.last_modified, task.estimated));
    } else {
      task.approxFormat = "NA";
    }
  };

  /**
   * Gets task object to the given id.
   * @param {Object} tab - Active tab data.
   * @param {Number} id - Task id.
   * @return {Object} Task object.
   */
  $scope.getTaskFromId = function (tab, id) {
    return tab.data.filter(function (item) {
      return item.id === id;
    })[0];
  };

  /**
   * Opens a modal dialog to delete the selected tasks.
   * Stops refresh till the dialog closes.
   */
  $scope.taskDeleteAction = function () {
    var tab = $scope.getActiveTab();
    var items = tab.selection.items;
    var modalInstance = {};
    if (!items) {
      return;
    }
    modalInstance = $uibModal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "components/taskQueue/templates/task-deletion.html",
      controller: "TaskDeleteCtrl",
      resolve: {
        taskSelection: function () {
          return items.map(function (id) {
            return $scope.getTaskFromId(tab, id);
          });
        }
      }
    });

    modalInstance.opened.then(function () {
      $interval.cancel($scope.timeout);
    });

    modalInstance.closed.then(function () {
      $scope.loadAllTabs(true);
    });
  };

  /**
   * Triggers a refresh over all tabs, but only if there are no pending requests and no selection of a task.
   * @param {Boolean} force - If set a reload will be forced even if there is a selection.
   */
  $scope.loadAllTabs = function (force) {
    var tab = $scope.getActiveTab();
    var items = tab.selection.items;
    if (!force && items.length > 0) {
      $scope.reloadTaskIn(globalConfig.GUI.defaultTaskReloadTime);
      return;
    }
    taskQueueFetcher.loadOverview().then(function (allTasks) {
      Object.keys($scope.tabs).forEach(function (tabKey) {
        $scope.loadTabTasks(tabKey, allTasks);
      });
    });
  };

  /**
   * Stops old timeout if any and sets a new time out which will be triggered in "time" seconds.
   * @param {Number} time - Number represents seconds.
   */
  $scope.reloadTaskIn = function (time) {
    if ($scope.timeout) {
      $interval.cancel($scope.timeout);
    }
    $scope.timeout = $interval(function () {
      $scope.loadAllTabs();
    }, time, 1);
  };

  /**
   * Triggers instant table update on tab change.
   */
  $scope.$watch("modalTabData.active", function (tabNew, tabOld) {
    if (tabOld !== null && tabNew !== null) {
      $scope.loadAllTabs(true);
    }
  });

  /**
   * Triggers instant table update when the modal dialog is fully opened..
   */
  $uibModalInstance.opened.then(function () {
    $scope.loadAllTabs();
  });

  /**
   * Cancels any refresh call, when the dialog is closed.
   */
  $uibModalInstance.closed.then(function () {
    $interval.cancel($scope.timeout);
  });
});
