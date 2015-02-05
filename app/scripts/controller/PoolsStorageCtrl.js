angular.module('openattic')
  .controller('PoolStorageCtrl', function ($scope, $stateParams, PoolService) {
    new PoolService($scope.selection.item).$storage().then(function (res) {
      $scope.active_pool_storage = res;
    });
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
