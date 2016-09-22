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

var app = angular.module("openattic.runnersQ");
app.controller("RunnersQModalCtrl", function ($scope, $uibModalInstance, toasty, tasks, $state, $filter) {
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

  $scope.updateTaskSelection = function (key, items) {
    $scope.tabs[key].selection.item = items.length === 1 ? items[0] : null;
    $scope.tabs[key].selection.items = items;
  };

  $scope.toggleTaskSelection = function (item, key, $event) {
    var items = $scope.tabs[key].selection.items;
    var exists = items.indexOf(item);
    if (exists !== -1 && $event.target.tagName !== "INPUT" || $event.target.tagName === "INPUT" && !$event.target.checked){
      items.splice(exists, 1);
    } else {
      if ($event.target.checked || $event.ctrlKey ){
        items.push(item);
      } else if ($event.shiftKey) {
        var tab = $scope.tabs[key];
        var sorted = $filter('orderBy')(tab.data, tab.tableSort.attribute);
        if (tab.tableSort.reverse) {
          sorted.reverse();
        }
        var iPrev = sorted.indexOf(items[items.length-1]);
        var iNow = sorted.indexOf(item);
        var newItems = iPrev < iNow ? sorted.slice(iPrev + 1, iNow + 1) : sorted.slice(iNow, iPrev);
        newItems.forEach(function (item) {
          var exists = items.indexOf(item);
          if (exists !== -1){
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
    $scope.tabs[key].selection.items = tab.selection.checkAll ? tab.data.slice() : [] ;
  };

  $scope.closeTasks = function () {
    $uibModalInstance.dismiss("close");
  };

  $scope.tabs = {
    pending: {
      name: "Pending",
      data: tasks.pending,
      tableSort: {
        attribute: 'done',
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
          attribute: "name",
          type: "text",
          width: "30%"
        },
        {
          name: "Created",
          attribute: "started",
          type: "date",
          width: "15%"
        },
        {
          name: "Complete",
          attribute: "done",
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
      tableSort: {
        attribute: 'ended',
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
          attribute: "name",
          width: "22%"
        },
        {
          name: "Created",
          type: "date",
          attribute: "started",
          width: "15%"
        },
        {
          name: "Completed to",
          type: "percent",
          attribute: "done",
          css: "danger",
          width: "35%"
        },
        {
          name: "Failed",
          type: "date",
          attribute: "ended",
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
    complete: {
      name: "Done",
      data: tasks.complete,
      tableSort: {
        attribute: 'ended',
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
          attribute: "name"
        },
        {
          name: "Created",
          type: "date",
          attribute: "started"
        },
        {
          name: "Finished",
          type: "date",
          attribute: "ended"
        }
      ]
    }
  };
});
