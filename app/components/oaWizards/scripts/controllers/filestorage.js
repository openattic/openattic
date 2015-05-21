'use strict';

angular.module('openattic.oaWizards')
  .controller('filestorage', function($scope, PoolService) {
    $scope.input = {
      cifs: {
        create    : false,
        available : true,
        browseable: true,
        writeable : true
      },
      nfs: {
        create    : false,
        options   : 'rw,no_subtree_check,no_root_squash'
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

            var chosenFilesystem = $scope.input.volume.filesystem;
            if(typeof chosenFilesystem === 'undefined' || !(chosenFilesystem in $scope.supported_filesystems)){
              if('xfs' in $scope.supported_filesystems){
                $scope.input.volume.filesystem = 'xfs';
              }
            }
          }, function(error) {
            console.log('An error occured', error);
          });
      }
    });

    $scope.$watch('input.volume.name', function(volumename) {
      if(volumename){
        $scope.input.cifs.name = volumename;
        $scope.input.cifs.path = '/media/' + volumename;
        $scope.input.nfs.path = '/media/' + volumename;
      }
    });
  });