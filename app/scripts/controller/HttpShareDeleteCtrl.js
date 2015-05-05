angular.module('openattic')
  .controller('HttpShareDeleteCtrl', function($scope, HttpSharesService, $modalInstance, share) {
    'use strict';

    $scope.share = share;

    $scope.delete = function(){
      HttpSharesService.delete({id: $scope.share.id})
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
        title: 'Delete share',
        content: '<i class="fa fa-clock-o"></i> <i>Cancelled</i>',
        color: '#C46A69',
        iconSmall: 'fa fa-times fa-2x fadeInRight animated',
        timeout: 4000
      });
    };
  });