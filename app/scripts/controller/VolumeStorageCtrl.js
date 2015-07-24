angular.module('openattic')
  .controller('VolumeStorageCtrl', function ($scope, VolumeService) {
    'use strict';
    $scope.$watch('selection.item', function(item){
      if(item){
        $scope.storage = VolumeService.storage({id: item.id});
      }
    });
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
