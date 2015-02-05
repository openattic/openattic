angular.module('openattic')
  .controller('PoolCtrl', function ($scope, $stateParams, $state, PoolService) {
    $scope.stateParams = $stateParams;

    $scope.data = {};

    $scope.filterConfig = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: 'name',
      sortorder: 'ASC'
    };

    $scope.selection = {
      current: "A"
    };

    $scope.$watch("filterConfig", function(){
      PoolService.filter({
        page:      $scope.filterConfig.page + 1,
        page_size: $scope.filterConfig.entries,
        search:    $scope.filterConfig.search,
        ordering:  $scope.filterConfig.ordering
      })
      .$promise
      .then(function (res) {
        $scope.data = res;
      })
      .catch(function (error) {
        console.log('An error occurred', error);
      });
    });

    $scope.onSelectionChange = function (oadatatable) {
      var selection = oadatatable.getSelection();
      if (selection.length == 1) {
        $scope.active_pool = selection[0];
        $scope.selection.current = selection[0];
        $scope.active_pool_storage = null;
        $state.go('pools.detail.status', {pool: selection[0].id})
        new PoolService($scope.active_pool).$storage().then(function (res) {
          $scope.active_pool_storage = res;
        });

      }
      else {
        $state.go('pools');
        $scope.active_pool = null;
        $scope.active_pool_storage = null;
      }
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
