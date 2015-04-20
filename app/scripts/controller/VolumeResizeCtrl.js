'use strict';

angular.module('openattic')
  .controller('VolumeResizeCtrl', function($scope, VolumeService, PoolService, SizeParserService, $modalInstance, volume) {
    $scope.volume = volume;
    $scope.input = {
      newsize: '',
      resizeForm: ''
    };

    PoolService.get(volume.source_pool)
      .$promise
      .then(function (res) {
        $scope.pool = res;
      });

    $scope.resize = function(){
      $scope.submitted = true;
      if($scope.input.resizeForm.$valid) {
        new VolumeService({
          id: $scope.volume.id,
          megs: SizeParserService.parseInt($scope.input.newsize)
        }).$update()
          .then(function () {
            $modalInstance.close('resized');
          }, function (error) {
            console.log('An error occured', error);
          });
      }
    };

    $scope.cancel = function(){
      $modalInstance.dismiss('cancel');

      $.smallBox({
        title: 'Resize volume',
        content: '<i class="fa fa-clock-o"></i> <i>Cancelled</i>',
        color: '#C46A69',
        iconSmall: 'fa fa-times fa-2x fadeInRight animated',
        timeout: 4000
      });
    };
  });