/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
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
    taskQueueService, $uibModal, $interval, $http) {
  /**
   * Describes and configures all displayed tabs and tables.
   */
  $scope.tabs = {
    pending: {
      name: "Pending",
      data: [],
      states: ["Running", "Not Started"],
      count: null,
      loaded: false,
      tableSort: {
        attribute: "percent",
        reverse: true
      },
      selection: {
        item: null,
        items: [],
        checkAll: false
      },
      tableColumns: [
        {
          name: "Name",
          attribute: "description",
          type: "text",
          width: "30%"
        },
        {
          name: "Created",
          attribute: "created",
          type: "date",
          width: "25%"
        },
        {
          name: "Complete",
          attribute: "percent",
          type: "percent",
          width: "25%"
        },
        {
          name: "Estimated",
          attribute: "approx",
          displayAttr: "approxFormat",
          type: "text",
          width: "17%"
        }
      ]
    },
    failed: {
      name: "Failed",
      data: [],
      states: ["Exception", "Aborted"],
      count: null,
      loaded: false,
      tableSort: {
        attribute: "last_modified",
        reverse: true
      },
      selection: {
        item: null,
        items: [],
        checkAll: false
      },
      tableColumns: [
        {
          name: "Name",
          type: "text",
          attribute: "description",
          width: "30%"
        },
        {
          name: "Created",
          type: "date",
          attribute: "created",
          width: "25%"
        },
        {
          name: "Runtime",
          attribute: "approx",
          displayAttr: "approxFormat",
          type: "date",
          width: "17%"
        },
        {
          name: "Failed",
          type: "date",
          attribute: "last_modified",
          width: "25%"
        }
      ]
    },
    finished: {
      name: "Done",
      data: [],
      states: ["Finished"],
      count: null,
      loaded: false,
      tableSort: {
        attribute: "last_modified",
        reverse: true
      },
      selection: {
        item: null,
        items: [],
        checkAll: false
      },
      tableColumns: [
        {
          name: "Name",
          type: "text",
          attribute: "description",
          width: "30%"
        },
        {
          name: "Created",
          type: "date",
          attribute: "created",
          width: "25%"
        },
        {
          name: "Runtime",
          attribute: "approx",
          displayAttr: "approxFormat",
          type: "date",
          width: "17%"
        },
        {
          name: "Finished",
          type: "date",
          attribute: "last_modified",
          width: "25%"
        }
      ]
    }
  };
  $scope.reloadTime = 5000;

  /**
   * Returns the data of the active tab.
   * @returns {object} - Data of active tab.
   */
  $scope.getActiveTab = function () {
    return $scope.tabs[Object.keys($scope.tabs)[$scope.modalTabData.active]];
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
    return $scope.updateSelectedTasks(tab, selection);
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
    var exists = -1;
    var sorted = [];
    var iPrev = 0;
    var iNow = 0;
    var newItems = [];
    if ($event.target.checked || $event.ctrlKey) {
      exists = items.indexOf(task.id);
      if (exists !== -1) {
        items.splice(exists, 1);
      } else {
        items.push(task.id);
      }
    } else if ($event.shiftKey) {
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
    } else {
      items = [task.id];
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
   * Counts all tasks in the tabs and triggers call for all tasks in the active tab.
   * @param {String} tabKey - Attribute of the tab where it retrieves the task count.
   * @throws {object} Throws an error and shows a toasty if the API call fails.
   */
  $scope.loadTabTasks = function (tabKey) {
    var tab = $scope.tabs[tabKey];
    tab.tempCount = 0;
    tab.pageCount = 0;
    tab.pageMax = 0;
    tab.loadingCount = 0;
    tab.tempData = [];
    $scope.tabs[tabKey] = tab;
    tab.states.forEach(function (state) {
      taskQueueService.get({
          pageSize: 1,
          status: state
        })
        .$promise
        .then(function (res) {
          var tab = $scope.tabs[tabKey];
          var max = res.count === 0 ? 0 : parseInt(res.count / 100, 10) + 1;
          tab.tempCount += res.count;
          tab.loadingCount++;
          tab.pageMax += max;
          if (tab.loadingCount === tab.states.length) {
            tab.count = tab.tempCount;
            if (tab.pageMax === 0) {
              tab.data = [];
              tab.loaded = true;
              // Reload all tasks if many after a longer timeout has passed to reduce the load on the client.
              $scope.reloadTaskIn($scope.reloadTime);
            }
          }
          $scope.tabs[tabKey] = tab;
          if ($scope.modalTabData && tabKey !== Object.keys($scope.tabs)[$scope.modalTabData.active]) {
            return;
          }
          for (var i = 1; i <= max; i++) {
            $scope.loadTabTasksPage(i, state, tabKey);
          }
        })
        .catch(function (error) {
          error.toasty = {
            title: "Background task loading failure",
            msg: "Background tasks with status " + state + " couldn't be loaded.",
            timeout: 10000
          };
          toasty.error(error.toasty);
          throw error;
        });
    });
  };

  /**
   * Loads a page with at max 100 tasks of a task state that is seen in the active tab.
   * @param {number} pgnr - The page number to fetch with at max 100 tasks.
   * @param {String} state - The state each task represents.
   * @param {String} tabKey - Attribute of the tab where it retrieves the task count.
   * @throws {object} Throws an error and shows a toasty if the API call fails.
   */
  $scope.loadTabTasksPage = function (pgnr, state, tabKey) {
    taskQueueService.get({
      page: pgnr,
      pageSize: 100,
      status: state
    })
      .$promise
      .then(function (res) {
        if (state === "Running") {
          res.results.forEach($scope.calcApprox);
        } else if (["Exception", "Aborted", "Finished"].indexOf(state) !== -1) {
          res.results.forEach($scope.calcRuntime);
        }

        var tab = $scope.tabs[tabKey];
        tab.tempData = tab.tempData.concat(res.results);
        tab.pageCount++;
        $scope.tabs[tabKey] = tab;
        if (tab.pageCount === tab.pageMax) {
          tab.loaded = true;
          tab.data = tab.tempData;
          $scope.tabs[tabKey] = $scope.updateCompleteSelection(tab);
          // Reload all tasks if many after a longer timeout has passed to reduce the load on the client.
          $scope.reloadTaskIn(tab.pageMax * $scope.reloadTime);
        }
      })
      .catch(function (error) {
        error.toasty = {
          title: "Background task loading failure",
          msg: "Background tasks with status " + state + " page " + pgnr + " couldn't be loaded.",
          timeout: 10000
        };
        toasty.error(error.toasty);
        throw error;
      });
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
   * @return {Object} - Task object.
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
      controller: "TaskDeletionCtrl",
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
      $scope.loadAllTabs();
    });
  };

  /**
   * Triggers a refresh over all tabs, but only if there are no pending requests.
   */
  $scope.loadAllTabs = function () {
    if ($http.pendingRequests.length > 0) {
      $scope.reloadTaskIn(30);
      return;
    }
    Object.keys($scope.tabs).forEach(function (tabKey) {
      $scope.loadTabTasks(tabKey);
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
      $scope.loadAllTabs();
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
