angular.module('openattic')
    .controller('PoolCtrl', function ($scope, $stateParams, PoolService) {
        $scope.stateParams = $stateParams;


      $scope.onSelectionChange = function(oadatatable){
          if( oadatatable.getSelection().length == 1 ){
              $scope.active_pool = oadatatable.getSelection()[0];
              $scope.active_pool_storage = null;
              new PoolService($scope.active_pool).$storage().then(function(res){
                  $scope.active_pool_storage = res;
              });
          }
          else{
              $scope.active_pool = null;
              $scope.active_pool_storage = null;
          }
      }
    });