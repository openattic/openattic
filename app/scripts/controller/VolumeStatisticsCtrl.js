angular.module('openattic')
  .controller('VolumeStatisticsCtrl', function ($scope, $stateParams, VolumeService) {
    'use strict';
    $scope.$watch('selection.item', function(selitem){
      if(!selitem){
        return;
      }
      $scope.active_volume_services = new VolumeService(selitem).$services();
    });
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
