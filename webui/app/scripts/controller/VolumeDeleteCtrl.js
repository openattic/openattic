angular.module('openattic')
  .controller('VolumeDeleteCtrl', function($scope, VolumeService, $modalInstance, volume) {
    'use strict';

    $scope.volume = volume;
    $scope.input = {
      enteredName: ''
    };

    $scope.delete = function(){
      VolumeService.delete({id: $scope.volume.id})
        .$promise
        .then(function() {
          $modalInstance.close('deleted');
        }, function(error){
          console.log('An error occured', error);
        });
    };

    $scope.cancel = function(){
      $modalInstance.dismiss('cancel');

      $.smallBox({
        title: 'Delete volume',
        content: '<i class="fa fa-clock-o"></i> <i>Cancelled</i>',
        color: '#C46A69',
        iconSmall: 'fa fa-times fa-2x fadeInRight animated',
        timeout: 4000
      });
    };
  });