angular.module('openattic')
  .controller('VolumeSnapshotDeleteCtrl', function($scope, VolumeService, SnapshotService, $modalInstance, snap) {
    'use strict';

    $scope.snap = snap;

    $scope.delete = function(){
      SnapshotService.delete({id: $scope.snap.id})
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
        title: 'Delete snapshot',
        content: '<i class="fa fa-clock-o"></i> <i>Cancelled</i>',
        color: '#C46A69',
        iconSmall: 'fa fa-times fa-2x fadeInRight animated',
        timeout: 4000
      });
    };
  });