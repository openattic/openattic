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
      VolumeService.clone({'id': $scope.volume.id, 'clone_obj': $scope.clone_obj})
        .$promise
        .then(function() {

        }, function(error){
          console.log('An error occured', error);
        });
    };

    $scope.cancel = function(){
      $modalInstance.dismiss('cancel');
    }
  });