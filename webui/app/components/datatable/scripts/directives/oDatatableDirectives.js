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

var app = angular.module("openattic.datatable");
app.directive("oadatatable", function () {
  return {
    restrict: "E",
    transclude: true,
    templateUrl: "components/datatable/templates/datatable.html",
    scope: {
      selection: "=",
      data: "=",
      filterConfig: "=",
      special: "="
    },
    link: function (scope, element, attr, controller, transclude) {
      transclude(scope, function (clone, scope) {
        element.find(".oadatatableactions").append(clone.filter("actions"));
        element.find(".dataTables_wrapper .dataTables_content>div").append(clone.filter("table"));
        element.find("th").each(function (index, item) {
          scope.columns[$(item).text()] = true;
          if (item.attributes.sortfield !== undefined) {
            scope.sortfields[$(item).text()] = item.attributes.sortfield.value;
          }
        });
      });
    },
    controller: function ($scope, $timeout, $http) {
      $scope.$watch(function () {
        return $http.pendingRequests.length > 0;
      }, function (value) {
        $scope.waiting = value;
      });

      $scope.columns = {};

      $scope.sortfields = {};

      $scope.selection = {
        item: null,
        items: [],
        checkAll: false,
        available: true
      };
      $scope.$watch("selection.checkAll", function (newVal) {
        if (!$scope.data.results) {
          return;
        }
        if (newVal) {
          $scope.selection.items = $scope.data.results.slice();
        } else {
          $scope.selection.items = [];
        }
      });
      $scope.toggleSelection = function (row, $event) {
        var idx;
        var add;
        if ($event.target.tagName === "INPUT" || $event.target.tagName === "A") {
          return;
        }

        $event.preventDefault();
        $event.stopPropagation();
        if ($event.ctrlKey) {
          idx = $scope.selection.items.indexOf(row);
          if (idx === -1) {
            $scope.selection.items.push(row);
          } else {
            $scope.selection.items.splice(idx, 1);
          }
        } else if ($event.shiftKey) {
          for (add = false, idx = 0; idx < $scope.data.results.length; idx++) {
            if (add) {
              $scope.selection.items.push($scope.data.results[idx]);
            } else if ($scope.selection.items.indexOf($scope.data.results[idx]) !== -1) {
              add = true;
            }

            if ($scope.data.results[idx] === row) {
              break;
            }
          }
        } else {
          $scope.selection.items = [row];
        }
      };

      $scope.isRowSelected = function (row) {
        return $scope.selection.items.indexOf(row) !== -1;
      };

      $scope.getSelection = function () {
        return $scope.selection.items.slice();
      };

      $scope.$watchCollection("selection.items", function () {
        if ($scope.selection.items.length === 1) {
          $scope.selection.item = $scope.selection.items[0];
        } else {
          $scope.selection.item = null;
        }
      });

      $scope.$watch("data", function () {
        $scope.selection.items = [];
        $scope.firstEntry = ($scope.filterConfig.page * $scope.filterConfig.entries) + 1;
        $scope.lastEntry = ($scope.filterConfig.page + 1) * $scope.filterConfig.entries;
        $scope.totalEntries = $scope.data.count;
        $scope.pages = Math.ceil($scope.totalEntries / $scope.filterConfig.entries);
        if ($scope.totalEntries <= $scope.lastEntry) {
          $scope.lastEntry = $scope.totalEntries;
          if ($scope.lastEntry === 0) {
            $scope.firstEntry = 0;
          }
        }
      });

      $scope.sortByField = function (field, direction) {
        if ($scope.filterConfig.sortfield !== field) {
          $scope.filterConfig.sortfield = field;
          $scope.filterConfig.sortorder = direction || "ASC";
        } else {
          $scope.filterConfig.sortorder = {
            "ASC": "DESC",
            "DESC": "ASC"
          }[$scope.filterConfig.sortorder];
        }
      };

      $scope.$watch("filterConfig.entries", function (newVal, oldVal) {
        $scope.filterConfig.page = Math.floor($scope.filterConfig.page * oldVal / newVal);
      });

      $scope.searchModelOptions = {
        updateOn: "default blur",
        debounce: {
          "default": 500,
          "blur": 0
        }
      };

      $scope.reloadTable = function () {
        $scope.filterConfig.reload = new Date();
      };
    }
  };
});