angular.module('openattic')
  .controller('VolumeStatisticsCtrl', function ($scope, $stateParams, VolumeService) {
    $scope.$watch("selection.item", function(selitem){
      if(!selitem) return;
      console.log(selitem);
      $scope.active_volume_services = new VolumeService(selitem).$services();
    });
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
