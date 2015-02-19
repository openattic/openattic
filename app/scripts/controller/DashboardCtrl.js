angular.module('openattic')
  .controller('DashboardCtrl', function ($scope, VolumeService){
    $scope.volumes = [];
    $scope.volumesLoaded = false;
    $scope.selectedVolume = null;

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
      if(volume.status.flags.nearfull   ){ msgs.push(volume.status.flags.nearfull   ) }
      if(volume.status.flags.highload   ){ msgs.push(volume.status.flags.highload   ) }
      if(volume.status.flags.highlatency){ msgs.push(volume.status.flags.highlatency) }
      if(volume.status.flags.randomio   ){ msgs.push(volume.status.flags.randomio   ) }
      return msgs.join(' ');
    };

    $scope.select = function(volume){
      $scope.selectedVolume = volume;
      new VolumeService(volume).$services()
      .then(function(services){
        var i, service, graphTitle;
        if(volume.status.flags.nearfull){
          service = services.filesystemvolume[0];
          graphTitle = 'Volume Space';
        }
        else if(volume.status.flags.highload){
          service = services.blockvolume[0];
          graphTitle = 'Disk Load';
        }
        else if(volume.status.flags.highlatency){
          service = services.blockvolume[0];
          graphTitle = 'Average Latency (r/w)';
        }
        else if(volume.status.flags.randomio){
          service = services.blockvolume[0];
          graphTitle = 'Average Request Size (r/w)';
        }
        $scope.serviceId = service.id;
        for(i = 0; i < service.graph_info.length; i++){
          if( service.graph_info[i].title === graphTitle ){
            $scope.graphId = service.graph_info[i].id;
            break;
          }
        }
      });
    };
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
