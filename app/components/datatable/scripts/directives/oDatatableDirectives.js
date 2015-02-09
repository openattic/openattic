angular.module('openattic.datatable')
  .directive('oadatatable', function () {
    return {
      restrict: 'E',
      transclude: true,
      templateUrl: "components/datatable/templates/datatable.html",
      scope: {
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
      },
      controller: function ($scope, $timeout, PoolService, $http) {
        $scope.$watch(function(){
          return $http.pendingRequests.length > 0;
        }, function(value) {
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
        $scope.$watch('selection.checkAll', function (newVal) {
          if (!$scope.data.results) {
            return;
          }
          if (newVal) {
            $scope.selection.items = $scope.data.results.slice();
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
            for (add = false, idx = 0; idx < $scope.data.results.length; idx++) {
              if (add)
                $scope.selection.items.push($scope.data.results[idx]);
              else if ($scope.selection.items.indexOf($scope.data.results[idx]) !== -1)
                add = true;
              if ($scope.data.results[idx] === row)
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

        $scope.$watchCollection('selection.items', function () {
          if ($scope.selection.items.length == 1) {
            $scope.selection.item = $scope.selection.items[0];
          }
          else {
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
            $scope.filterConfig.sortorder = {"ASC": "DESC", "DESC": "ASC"}[$scope.filterConfig.sortorder];
          }
        }

        $scope.$watch("filterConfig.entries", function (newVal, oldVal) {
          $scope.filterConfig.page = Math.floor($scope.filterConfig.page * oldVal / newVal);
        });

        $scope.searchModelOptions = {
          updateOn: 'default blur',
          debounce: {
            'default': 500,
             'blur': 0
          }
        };

        $scope.reloadTable = function(){
          $scope.filterConfig.reload = new Date();
        };
      }
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
