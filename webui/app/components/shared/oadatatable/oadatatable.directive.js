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

var app = angular.module("openattic.shared");
app.directive("oadatatable", function () {
  return {
    restrict: "E",
    transclude: true,
    template: require("./oadatatable.directive.html"),
    scope: {
      selection: "=",
      onSelectionChange: "&",
      onFilterConfigChange: "&",
      data: "=",
      filterConfig: "=",
      special: "="
    },
    link: function (scope, element, attr, controller, transclude) {
      transclude(scope, function (clone, _scope) {
        element.find(".oadatatableactions").append(clone.filter("actions")).append(clone.filter("additional-actions"));
        element.find(".dataTables_wrapper .dataTables_content").append(clone.filter("table"));
        element.find("th").each(function (index, item) {
          _scope.columns[$(item).text()] = angular.isUndefined($(item).attr("disabled"));
          if (item.attributes.sortfield) {
            _scope.sortfields[$(item).text()] = item.attributes.sortfield.value;
          }
        });
      });
    },
    controller: function ($scope, $localStorage, $http, $state) {
      var tableName = $state.current.name;
      var firstColCall = true;
      var firstFilterCall = true;
      if (!$localStorage.datatables) {
        $localStorage.datatables = {};
      }
      if (!$localStorage.datatables[tableName]) {
        $localStorage.datatables[tableName] = {};
      }
      $scope.store = $localStorage.datatables[tableName];

      /**
       * Evaluates on any digest!
       * It will be true if the API-call will match the last word of any active table.
       * If true a loading sign will appear.
       */
      $scope.$watch(function () {
        if (!$state.includes(tableName)) {
          return false;
        }
        return $http.pendingRequests.some(function (req) {
          return Boolean(req.url.match(tableName.match(/[^.]+$/)));
        });
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

      $scope.filterConfig.entries = $scope.store.entries || 10;

      /**
       * Watches for enabled or disabled columns.
       *
       * The first call will be handled differently than the rest, because the old column set will be loaded if
       * available or the column set will be saved to the local storage.
       *
       * The next calls will enable or disable columns and make sure that at least one column is checked.
       * The column change will be saved to the local storage object.
       */
      $scope.$watchCollection("columns", function (cols, oldCols) {
        if (firstColCall) {
          firstColCall = false;
          if (angular.isDefined($scope.store.columns)) {
            angular.forEach($scope.store.columns, function (value, key) {
              if (angular.isDefined(cols[key])) {
                cols[key] = value;
              }
            });
          }
          $scope.store.columns = cols;
          $scope.columns = $scope.store.columns;
        } else {
          var allowed = Object.keys(cols).some(function (colName) {
            return cols[colName];
          });
          if (allowed) {
            $scope.store.columns = cols;
          } else {
            $scope.columns = oldCols;
          }
        }
      });

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
        $scope.onSelectionChange({"selection": $scope.selection});
      });

      $scope.$watch("data", function () {
        if (angular.isUndefined($scope.data.count)) {
          return;
        }
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
        if (firstFilterCall) {
          firstFilterCall = false;
          if ($scope.store.sortfield && $scope.store.sortorder) {
            field = $scope.store.sortfield;
            direction = $scope.store.sortorder;
          }
        }
        if ($scope.filterConfig.sortfield !== field) {
          $scope.filterConfig.sortfield = field;
          $scope.filterConfig.sortorder = direction || "ASC";
        } else {
          $scope.filterConfig.sortorder = {
            "ASC": "DESC",
            "DESC": "ASC"
          }[$scope.filterConfig.sortorder];
        }
        $scope.store.sortfield = $scope.filterConfig.sortfield;
        $scope.store.sortorder = $scope.filterConfig.sortorder;
      };

      $scope.$watchCollection("filterConfig", function () {
        // Reset the selection, e.g. otherwise the statistic/detail tab page of the
        // previous selected row is still shown during the datatable is reloaded.
        $scope.selection.items = [];
        // Reset the data, thus the loading panel will be displayed automatically.
        $scope.data = [];
        // Reload the data.
        $scope.onFilterConfigChange();
      });

      $scope.$watch("filterConfig.entries", function (newVal, oldVal) {
        $scope.filterConfig.page = Math.floor($scope.filterConfig.page * oldVal / newVal);
        $scope.store.entries = newVal;
      });

      $scope.searchModelOptions = {
        updateOn: "default blur",
        debounce: {
          "default": 500,
          "blur": 0
        }
      };

      $scope.reloadTable = function () {
        // Reset the selection, e.g. otherwise the statistic/detail tab page of the
        // previous selected row is still shown during the datatable is reloaded.
        $scope.selection.items = [];
        // Force the reloading of the datatable content.
        $scope.filterConfig.reload = new Date();
      };
    }
  };
});
