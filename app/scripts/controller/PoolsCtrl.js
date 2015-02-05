angular.module('openattic')
  .controller('PoolCtrl', function ($scope, $stateParams, $state, PoolService) {
    $scope.stateParams = $stateParams;


    $scope.selection = {
      current: "A"
    };

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