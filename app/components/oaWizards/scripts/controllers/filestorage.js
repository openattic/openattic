'use strict';

angular.module('openattic.oaWizards')
  .controller('filestorage', function($scope, PoolService) {
    $scope.accordionOpen = {
      cifs: true,
      nfs : true
    };

    $scope.input = {
      volume: {
        filesystem: ''
      },
      cifs: {
        available : true,
        browseable: true,
        writeable : true
      }
    };

    PoolService.query()
      .$promise
      .then(function(res){
        $scope.pools = res;
      }, function (error) {
        console.log('An error occurred', error);
      });

    $scope.$watch('input.volume.volumepool', function(sourcePool) {
      if(sourcePool){
        new PoolService(sourcePool).$filesystems()
          .then(function(res) {
            $scope.supported_filesystems = res;
          }, function(error) {
            console.log('An error occured', error);
          });
      }
    });

    $scope.$watch('input.volume.name', function(volumename) {
      if(volumename){
        $scope.input.cifs.name = volumename;
        $scope.input.cifs.path = '/media/' + volumename;
      }
    })
  });