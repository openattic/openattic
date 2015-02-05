angular.module('openattic')
  .controller('VolumeSnapshotsCtrl', function ($scope, $stateParams, VolumeService) {
    'use strict';
    $scope.snapshotsData = {};

    $scope.snapshotsFilter = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: 'name',
      sortorder: 'ASC',
      volume: null
    };

    $scope.snapshotsSelection = {
    };

    $scope.$watch('selection.item', function(selitem){
      $scope.snapshotsFilter.volume = selitem;
    });

    $scope.$watch('snapshotsFilter', function(){
      if(!$scope.snapshotsFilter.volume){
        return;
      }
      new VolumeService($scope.snapshotsFilter.volume).$snapshots({
        page:      $scope.snapshotsFilter.page + 1,
        page_size: $scope.snapshotsFilter.entries,
        search:    $scope.snapshotsFilter.search,
        ordering:  ($scope.snapshotsFilter.sortorder === 'ASC' ? '' : '-') + $scope.snapshotsFilter.sortfield
      })
      .then(function (res) {
        $scope.snapshotsData = res;
      })
      .catch(function (error) {
        console.log('An error occurred', error);
      });
    }, true);
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
