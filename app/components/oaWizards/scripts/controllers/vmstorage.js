'use strict';

angular.module('openattic.oaWizards')
  .controller('vmstorage', function($scope, PoolService){
    var vmstorageFSs = ['XFS', 'ZFS', 'BTRFS'];

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
    $scope.selPoolUsedPercent = 0;

    PoolService.query()
      .$promise
      .then(function(res){
        $scope.pools = res;
      }, function (error) {
        console.log('An error occurred', error);
      });

    $scope.$watch('input.volume.volumepool', function(sourcePool) {
      if(sourcePool){
        $scope.selPoolUsedPercent = parseFloat(sourcePool.usage.used_pcnt).toFixed(2);
        $scope.contentForm1.volumepool.$setValidity('usablesize', $scope.input.volume.volumepool.usage.free >= 100);

        new PoolService(sourcePool).$filesystems()
          .then(function(res) {
            var filesystems = [];
            for(var i in vmstorageFSs){
              if(vmstorageFSs[i].toLowerCase() in res){
                filesystems.push(vmstorageFSs[i]);
              }
            }

            $scope.input.volume.filesystem = filesystems[0].toLowerCase();

            if(filesystems.length === 1){
              $scope.supported_filesystems = filesystems[0];
            }
            else {
              $scope.supported_filesystems = res;

              if('xfs' in res){
                $scope.input.volume.filesystem = 'xfs';
              }
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

        if($scope.contentForm1) {
          $scope.contentForm1.volumepool.$setValidity('usablesize', true);
        }
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