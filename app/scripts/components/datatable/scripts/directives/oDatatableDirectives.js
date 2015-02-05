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
        // TODO: Remove comma
        onSelectionChange: "&",
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
      controller: function ($scope, $timeout, FilterService) {
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

        $scope.reloadTable = function () {
          // TODO: $parent ref in a isolated scope/component => BAD
          if (typeof $scope.active !== "undefined" && !$scope.$parent.$eval($scope.active))
            return;
          FilterService.api_action($scope.service)
            .filter($scope.search)
            .paginate($scope.page, $scope.entries)
            .sortByField($scope.sortfield, $scope.sortorder)
            .first(function () {
              if ($scope.loadingOverlay) {
                $scope.loadingOverlay.fadeIn();
              }
              $scope.select.checkedItems = [];
            })
            .then(function (res) {
              $scope.select.checkedItems = [];
              $scope.data = res.data.results;
              $scope.firstEntry = ($scope.page * $scope.entries) + 1;
              $scope.lastEntry = ($scope.page + 1) * $scope.entries;
              $scope.totalEntries = res.data.count;
              $scope.pages = Math.ceil($scope.totalEntries / $scope.entries)
              if ($scope.totalEntries <= $scope.lastEntry) {
                $scope.lastEntry = $scope.totalEntries;
                if ($scope.lastEntry == 0) {
                  $scope.firstEntry = 0;
                }
              }
            })
            .else_(function (error) {
              console.log('An error occurred', error);
            })
            .finally_(function () {
              if ($scope.loadingOverlay) {
                $scope.loadingOverlay.fadeOut();
              }
            })
            .go();
        }

        $scope.page = 0;
        $scope.entries = $scope.startEntries || 10;
        $scope.search = "";

        $scope.sortfield = "";
        $scope.sortorder = "ASC";
        $scope.sortByField = function (field, direction) {
          if ($scope.sortfield !== field) {
            $scope.sortfield = field;
            $scope.sortorder = direction || "ASC";
          }
          else {
            $scope.sortorder = {"ASC": "DESC", "DESC": "ASC"}[$scope.sortorder];
          }
        }

        var timeoutPromise;
        var watchFunction = function (newVal, oldVal) {
          if ($scope['search'] === '') {
            // TODO: Add vat to the timeout => else "EVIL GLOBAL SCOPE"
            timeout = 20;
          }
          else {
            timeout = 1500;
          }
          $timeout.cancel(timeoutPromise);
          timeoutPromise = $timeout(function () {
            $scope.reloadTable();
          }, timeout);
        };


        $scope.$watch('service', watchFunction);
        $scope.$watch('page', watchFunction);
        $scope.$watch('entries', watchFunction);
        $scope.$watch('sortfield', watchFunction);
        $scope.$watch('sortorder', watchFunction);
        $scope.$watch('search', watchFunction);

        // $watchGroup is only available from angular version 1.3.0
        /*$scope.$watchGroup(['page', 'entries', 'sortfield', 'sortorder', 'search'], function(newVal, oldVal, scope) {
         if(scope['search'] === ''){
         self.reloadTable();
         }
         else {
         $timeout.cancel(timeoutPromise);
         timeoutPromise = $timeout(function(){
         self.reloadTable();
         }, 1500);
         }
         });*/


        $scope.$watch("entries", function (newVal, oldVal) {
          $scope.page = Math.floor($scope.page * oldVal / newVal);
        });
      }
    }

  })

// kate: space-indent on; indent-width 4; replace-tabs on;
