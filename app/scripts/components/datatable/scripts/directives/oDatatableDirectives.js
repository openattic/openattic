angular.module('openattic.datatable')
  .directive('oadatatable', function () {
    return {
      restrict: 'E',
      transclude: true,
      templateUrl: "scripts/components/datatable/templates/datatable.html",
      scope: {
        service: "@",
        active: "@",
        startEntries: "@entries",
        onSelectionChange: "&",
        data: "=",
        filterConfig: "="
      },
      link: function (scope, element, attr, controller, transclude) {
        transclude(scope, function (clone, scope) {
          element.find(".oadatatableactions").append(clone.filter("actions"));
          element.find(".dataTables_wrapper").append(clone.filter("table"));
          element.find("th").each(function (index, item) {
            scope.columns[$(item).text()] = true;
            if (item.attributes['sortfield'] != undefined) {
              scope.sortfields[$(item).text()] = item.attributes['sortfield'].value;
            }
          });
        });
        scope.loadingOverlay = element.find(".overlay");
      },
      controller: function ($scope, $timeout, PoolService) {
        $scope.columns = {};

        $scope.sortfields = {};

        $scope.select = {
          checkedItems: [],
          checkAll: false,
          available: true
        };
        $scope.$watch('select.checkAll', function (newVal) {
          if (!$scope.data) {
            return;
          }
          if (newVal) {
            $scope.select.checkedItems = $scope.data.slice();
          }
          else {
            $scope.select.checkedItems = [];
          }
        });
        $scope.toggleSelection = function (row, $event) {
          var idx, add;
          if ($event.target.tagName == "INPUT" || $event.target.tagName == "A")
            return;
          $event.preventDefault();
          $event.stopPropagation();
          if ($event.ctrlKey) {
            idx = $scope.select.checkedItems.indexOf(row);
            if (idx === -1) {
              $scope.select.checkedItems.push(row);
            }
            else {
              $scope.select.checkedItems.splice(idx, 1);
            }
          }
          else if ($event.shiftKey) {
            for (add = false, idx = 0; idx < $scope.data.length; idx++) {
              if (add)
                $scope.select.checkedItems.push($scope.data[idx]);
              else if ($scope.select.checkedItems.indexOf($scope.data[idx]) !== -1)
                add = true;
              if ($scope.data[idx] === row)
                break;
            }
          }
          else {
            $scope.select.checkedItems = [row];
          }
        }
        $scope.isRowSelected = function (row) {
          return $scope.select.checkedItems.indexOf(row) != -1;
        }

        $scope.getSelection = function () {
          return $scope.select.checkedItems.slice();
        }
        // TODO: Why is this function on the scope?
        $scope.watchSelection = function (callback) {
          return $scope.$watchCollection('select.checkedItems', callback);
        }

        $scope.actions = [];
        $scope.actions.topAction = 0;
        $scope.addAction = function (action) {
          $scope.actions.push(action);
        }
        $scope.triggerTopAction = function () {
          $scope.actions[$scope.actions.topAction].fn();
        }
        $scope.watchSelection(function () {
          if ($scope.select.checkedItems.length == 1) {
            $scope.actions.topAction = 1;
          }
          else {
            $scope.actions.topAction = 0;
          }
        });
        $scope.watchSelection(function () {
          $scope.onSelectionChange({"oadatatable": $scope});
        });

        $scope.$watch("data", function () {
          $scope.select.checkedItems = [];
          $scope.firstEntry   = ($scope.filterConfig.page * $scope.filterConfig.entries) + 1;
          $scope.lastEntry    = ($scope.filterConfig.page + 1) * $scope.filterConfig.entries;
          $scope.totalEntries = $scope.data.count;
          $scope.pages = Math.ceil($scope.totalEntries / $scope.filterConfig.entries)
          if ($scope.totalEntries <= $scope.lastEntry) {
            $scope.lastEntry = $scope.totalEntries;
            if ($scope.lastEntry == 0) {
              $scope.firstEntry = 0;
            }
          }
        });

        $scope.sortByField = function (field, direction) {
          if ($scope.filterConfig.sortfield !== field) {
            $scope.filterConfig.sortfield = field;
            $scope.filterConfig.sortorder = direction || "ASC";
          }
          else {
            $scope.filterConfig.sortorder = {"ASC": "DESC", "DESC": "ASC"}[$scope.sortorder];
          }
        }

        $scope.$watch("filterConfig.entries", function (newVal, oldVal) {
          $scope.filterConfig.page = Math.floor($scope.filterConfig.page * oldVal / newVal);
        });
      }
    }

  })

// kate: space-indent on; indent-width 2; replace-tabs on;
