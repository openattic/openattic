angular.module('openattic')
  .controller('VolumeSnapshotsCtrl', function ($scope, $state, VolumeService, SnapshotService, $modal) {
    'use strict';

    $scope.snapshotsData = {};

    $scope.snapshotsFilter = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: null,
      sortorder: null,
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
        ordering:  ($scope.snapshotsFilter.sortorder === 'ASC' ? '' : '-') + $scope.snapshotsFilter.sortfield,
        volume:    $scope.snapshotsFilter.volume.id
      })
      .then(function (res) {
        $scope.snapshotsData = res;
      })
      .catch(function (error) {
        console.log('An error occurred', error);
      });
    }, true);

    $scope.addAction = function(){
      $state.go('volumes.detail.snapshots-add');
    };

    $scope.deleteAction = function(){
      var modalInstance = $modal.open({
        windowTemplateUrl: 'templates/messagebox.html',
        templateUrl: 'templates/volumes/snapshot-delete.html',
        controller: 'VolumeSnapshotDeleteCtrl',
        resolve: {
          snap: function(){
            return $scope.snapshotsSelection.item;
          }
        }
      });
      modalInstance.result.then(function(){
        $scope.filterConfig.refresh = new Date();
      });
    };

    $scope.cloneAction = function(){
      var modalInstance = $modal.open({
        windowTemplateUrl: 'templates/messagebox.html',
        templateUrl: 'templates/volumes/clone.html',
        controller: 'VolumeCloneCtrl',
        resolve: {
          volume: function() {
            return $scope.snapshotsSelection.item;
          }
        }
      });

      modalInstance.result.then(function() {
        $scope.snapshotsFilter.refresh = new Date();
      });
    };
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
