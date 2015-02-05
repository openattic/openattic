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
        selection: "=",
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

        $scope.selection = {
          item: null,
          items: [],
          checkAll: false,
          available: true
        };
        $scope.$watch('selection.checkAll', function (newVal) {
          if (!$scope.data) {
            return;
          }
          if (newVal) {
            $scope.selection.items = $scope.data.slice();
          }
          else {
            $scope.selection.items = [];
          }
        });
        $scope.toggleSelection = function (row, $event) {
          var idx, add;
          if ($event.target.tagName == "INPUT" || $event.target.tagName == "A")
            return;
          $event.preventDefault();
          $event.stopPropagation();
          if ($event.ctrlKey) {
            idx = $scope.selection.items.indexOf(row);
            if (idx === -1) {
              $scope.selection.items.push(row);
            }
            else {
              $scope.selection.items.splice(idx, 1);
            }
          }
          else if ($event.shiftKey) {
            for (add = false, idx = 0; idx < $scope.data.length; idx++) {
              if (add)
                $scope.selection.items.push($scope.data[idx]);
              else if ($scope.selection.items.indexOf($scope.data[idx]) !== -1)
                add = true;
              if ($scope.data[idx] === row)
                break;
            }
          }
          else {
            $scope.selection.items = [row];
          }
        }
        $scope.isRowSelected = function (row) {
          return $scope.selection.items.indexOf(row) != -1;
        }

        $scope.getSelection = function () {
          return $scope.selection.items.slice();
        }
        // TODO: Why is this function on the scope?
        $scope.watchSelection = function (callback) {
          return $scope.$watchCollection('selection.items', callback);
        }

        $scope.actions = [];
        $scope.actions.topAction = 0;
        $scope.addAction = function (action) {
          $scope.actions.push(action);
        }
        $scope.triggerTopAction = function () {
          $scope.actions[$scope.actions.topAction].fn();
        }
        $scope.$watchCollection('selection.items', function () {
          if ($scope.selection.items.length == 1) {
            $scope.actions.topAction = 1;
            $scope.selection.item = $scope.selection.items[0];
          }
          else {
            $scope.actions.topAction = 0;
            $scope.selection.item = null;
          }
        });

        $scope.$watch("data", function () {
          $scope.selection.items = [];
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
