angular.module('openattic')
  .controller('PoolStorageCtrl', function ($scope, $stateParams, PoolService) {
    'use strict';
    $scope.$watch('selection.item', function(item){
      if(item){
        $scope.storage = PoolService.storage({id: item.id});
      }
    });
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
