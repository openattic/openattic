angular.module('openattic')
  .controller('VolumeSnapshotFormCtrl', function ($scope, $state, $filter, $stateParams, VolumeService, VolumeSnapshotService, PoolService, SizeParserService) {
    'use strict';

    $scope.snap = {
      'volumeId': $scope.selection.item.id,
      'name': $filter('date')(new Date(), 'yyyy-MM-dd-HH-mm-ss'),
      'megs':  ''
    };

    $scope.megs = $scope.selection.item.usage.size_text;

    $scope.$watch('megs', function(megs){
      $scope.snap.megs = SizeParserService.parseInt(megs);
    });

    $scope.pool = new PoolService.get($scope.selection.item.source_pool);

    $scope.submitAction = function() {
      new VolumeSnapshotService($scope.snap)
        .$save()
        .then(function() {
          goToListView();
        }, function(error) {
          console.log('An error occured', error);
        });
    };

    $scope.cancelAction = function() {
      goToListView();
    };

    var goToListView = function() {
      $state.go('volumes.detail.snapshots');
    };
  });

// kate: space-indent on; indent-width 2; replace-tabs on;