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
app.controller("TaskQueueModalCtrl", function ($scope, $uibModalInstance, toasty, tasks, $state, $filter,
    taskQueueService) {

  $scope.tasksFilter = {
    page: 0,
    entries: null,
    search: "",
    sortfield: null,
    sortorder: null,
    volume: null
  };

  $scope.order = function (attribute, tab) {
    if (tab.tableSort.attribute === attribute) {
      tab.tableSort.reverse = !tab.tableSort.reverse;
    }
    tab.tableSort.attribute = attribute;
  };

  $scope.orderClass = function (attribute, tab) {
    var cssClass = "sorting";
    if (tab.tableSort.attribute === attribute) {
      cssClass = tab.tableSort.reverse ? "sorting_desc" : "sorting_asc";
    }
    return cssClass;
  };

  $scope.selectColumn = function (attr, data) {
    var attribute = attr.displayAttr || attr.attribute;
    return data[attribute];
  };

  $scope.isTaskSelected = function (row, tab) {
    return tab.selection.items.indexOf(row) !== -1;
  };

  $scope.updateTaskSelection = function (key, items) {
    $scope.tabs[key].selection.item = items.length === 1 ? items[0] : null;
    $scope.tabs[key].selection.items = items;
  };

  $scope.toggleTaskSelection = function (item, key, $event) {
    var items = $scope.tabs[key].selection.items;
    var exists = items.indexOf(item);
    if (exists !== -1 && $event.target.tagName !== "INPUT" ||
        $event.target.tagName === "INPUT" && !$event.target.checked) {
      items.splice(exists, 1);
    } else {
      if ($event.target.checked || $event.ctrlKey) {
        items.push(item);
      } else if ($event.shiftKey) {
        var tab = $scope.tabs[key];
        var sorted = $filter("orderBy")(tab.data, tab.tableSort.attribute);
        if (tab.tableSort.reverse) {
          sorted.reverse();
        }
        var iPrev = sorted.indexOf(items[items.length - 1]);
        var iNow = sorted.indexOf(item);
        var newItems = iPrev < iNow ? sorted.slice(iPrev + 1, iNow + 1) : sorted.slice(iNow, iPrev);
        newItems.forEach(function (item) {
          var exists = items.indexOf(item);
          if (exists !== -1) {
            items.splice(exists, 1);
          } else {
            items.push(item);
          }
        });
      } else {
        items = [item];
      }
    }
    $scope.updateTaskSelection(key, items);
  };

  $scope.checkAllTasks = function (key) {
    var tab = $scope.tabs[key];
    $scope.tabs[key].selection.items = tab.selection.checkAll ? tab.data.slice() : [];
  };

  $scope.closeTasks = function () {
    $uibModalInstance.dismiss("close");
  };

  $scope.tabs = {
    pending: {
      name: "Pending",
      data: tasks.pending,
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
          width: "15%"
        },
        {
          name: "Complete",
          attribute: "percent",
          type: "percent",
          width: "42%"
        },
        {
          name: "Approx",
          attribute: "approx",
          displayAttr: "approxFormat",
          type: "text",
          width: "10%"
        }
      ]
    },
    failed: {
      name: "Failed",
      data: tasks.failed,
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
          width: "22%"
        },
        {
          name: "Created",
          type: "date",
          attribute: "created",
          width: "15%"
        },
        {
          name: "Completed to",
          type: "percent",
          attribute: "percent",
          css: "danger",
          width: "35%"
        },
        {
          name: "Failed",
          type: "date",
          attribute: "last_modified",
          width: "15%"
        },
        {
          name: "Error",
          type: "text",
          attribute: "errCode",
          width: "10%"
        }
      ]
    },
    finished: {
      name: "Done",
      data: tasks.finished,
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
          attribute: "description"
        },
        {
          name: "Created",
          type: "date",
          attribute: "created"
        },
        {
          name: "Finished",
          type: "date",
          attribute: "last_modified"
        }
      ]
    }
  };

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
          tab.tempCount += res.count;
          tab.loadingCount++;
          var max = parseInt((res.count + 99) / 100, 10);
          tab.pageMax += max;
          if (tab.loadingCount === tab.states.length) {
            tab.count = tab.tempCount;
            if (tab.pageMax === 0) {
              tab.loaded = true;
            }
          }
          console.log(tab, tab.pageCount, tab.pageMax);
          $scope.tabs[tabKey] = tab;
          if (res.count === 0) {
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
        }
        var tab = $scope.tabs[tabKey];
        tab.tempData = tab.tempData.concat(res.results);
        tab.pageCount++;
        console.log(tab, tab.pageCount, tab.pageMax);
        $scope.tabs[tabKey] = tab;
        if (tab.pageCount === tab.pageMax) {
          tab.loaded = true;
          tab.data = tab.tempData;
          $scope.tabs[tabKey] = tab;
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

  $scope.calcApprox = function (task) {
    task.created = new Date(task.created);
    task.last_modified = new Date(task.last_modified);
    var runtime = task.last_modified.getTime() - task.created.getTime();
    var approx = new Date(Math.floor((100 / task.percent) * runtime) - runtime);
    var days = approx.getDate() - 1;
    var h = approx.getHours() - 1;
    var m = approx.getMinutes();
    var approxFormat = (days > 0) ? days + "d " : "";
    approxFormat += (h > 0) ? h + "h " : "";
    approxFormat += (approxFormat !== "" || m > 0) ? m + "m" : "< 1m";
    task.approx = approx;
    task.approxFormat = approxFormat;
  };

  $scope.loadAllTabs = function () {
    Object.keys($scope.tabs).forEach(function (tabKey) {
      $scope.loadTabTasks(tabKey);
    });
  };
  $uibModalInstance.opened.then(function () {
      $scope.loadAllTabs();
      $scope.tabRefresh = setInterval(function(){
        $scope.loadAllTabs();
      }, 10000);
  });
  $uibModalInstance.closed.then(function () {
    clearInterval($scope.tabRefresh);
  });
});
