angular.module('openattic')
  .controller('PoolStorageCtrl', function ($scope, $stateParams) {
    $scope.stateParams = $stateParams;
    new PoolService($scope.active_pool).$storage().then(function (res) {
      $scope.active_pool_storage = res;
    });
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
