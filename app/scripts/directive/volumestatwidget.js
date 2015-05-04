angular.module('openattic')
  .directive('volumestatwidget', function() {
    'use strict';

    return {
      restrict: 'A',
      scope: true,
      replace: true,
      templateUrl: 'templates/volumes/statwidget.html',
      controller: function($scope, VolumeService) {
        $scope.volumes = [];
        $scope.volumesLoaded = false;
        $scope.selectedVolume = null;

        $scope.dashboardparams = {
          profile: null
        };

        VolumeService.query()
          .$promise
          .then(function (res) {
            $scope.volumesLoaded = true;
            for( var i = 0; i < res.length; i++ ){
              if( res[i].status.status !== 'good' && res[i].status.status !== 'locked' ){
                $scope.volumes.push(res[i]);
              }
            }
          })
          .catch(function (error) {
            console.log('An error occurred', error);
          });

        $scope.volumeStatusMsg = function(volume){
          var msgs = [];
          if(volume.status.flags.nearfull   ){ msgs.push(volume.status.flags.nearfull   ); }
          if(volume.status.flags.highload   ){ msgs.push(volume.status.flags.highload   ); }
          if(volume.status.flags.highlatency){ msgs.push(volume.status.flags.highlatency); }
          if(volume.status.flags.randomio   ){ msgs.push(volume.status.flags.randomio   ); }
          return msgs.join(' ');
        };

        $scope.select = function(volume){
          $scope.selectedVolume = volume;
          if(volume.status.flags.nearfull){
            $scope.graphTitle = 'Volume Space';
          }
          else if(volume.status.flags.highload){
            $scope.graphTitle = 'Disk Load';
          }
          else if(volume.status.flags.highlatency){
            $scope.graphTitle = 'Average Latency (r/w)';
          }
          else if(volume.status.flags.randomio){
            $scope.graphTitle = 'Average Request Size (r/w)';
          }
        };
      }
    };
  });