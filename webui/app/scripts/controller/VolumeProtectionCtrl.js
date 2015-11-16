angular.module('openattic')
  .controller('VolumeProtectionCtrl', function($scope, VolumeService, $modalInstance, volume) {
    'use strict';

    $scope.volume = volume;

    $scope.setProtection = function() {
      new VolumeService({
        id: volume.id,
        is_protected: volume.is_protected
      }).$update()
        .then(function() {
          $modalInstance.dismiss('protection set');
        }, function(error) {
          console.log('An error occured', error);
        });
    };

    $scope.cancel = function(){
      $modalInstance.dismiss('cancel');

      $.smallBox({
        title: 'Set volume protection',
        content: '<i class="fa fa-clock-o"></i> <i>Cancelled</i>',
        color: '#C46A69',
        iconSmall: 'fa fa-times fa-2x fadeInRight animated',
        timeout: 4000
      });
    };
  });
