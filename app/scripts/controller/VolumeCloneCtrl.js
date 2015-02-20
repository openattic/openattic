angular.module('openattic')
  .controller('VolumeCloneCtrl', function($scope, VolumeService, $modalInstance, volume) {
    'use strict';

    $scope.volume = volume;
    $scope.clone_obj = {};

    if('snapshot' in volume){
      $scope.type = 'snapshot';
    }
    else {
      $scope.type = 'volume';
    }

    $scope.clone = function(){
    };

    $scope.cancel = function(){
      $modalInstance.dismiss('cancel');
    }
  });