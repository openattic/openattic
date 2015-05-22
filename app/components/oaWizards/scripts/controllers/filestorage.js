'use strict';

angular.module('openattic.oaWizards')
  .controller('filestorage', function($scope, PoolService) {
    var filestorageFSs = ['ZFS', 'BTRFS', 'Ext4', 'Ext3'];

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
            var filesystems = [];
            for(var i in filestorageFSs){
              if(filestorageFSs[i].toLowerCase() in res){
                filesystems.push(filestorageFSs[i]);
              }
            }

            $scope.supported_filesystems = res;

            if(filesystems.length === 1){
              $scope.supported_filesystems = filesystems[0];
            }

            $scope.input.volume.filesystem = filesystems[0].toLowerCase();
            $scope.filesystems_count = filesystems.length;
          }, function(error) {
            console.log('An error occured', error);
          });
      }
      else {
        $scope.filesystems_count = 0;
        $scope.supported_filesystems = 'Choose a pool first';
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