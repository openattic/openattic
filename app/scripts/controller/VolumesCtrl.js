angular.module('openattic')
  .controller('VolumeCtrl', function ($scope, $stateParams, $state, VolumeService) {
    'use strict';
    $scope.stateParams = $stateParams;

    $scope.data = {};

    $scope.filterConfig = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: null,
      sortorder: null
    };

    $scope.selection = {
    };

    $scope.$watch('filterConfig', function(){
      VolumeService.filter({
        page:      $scope.filterConfig.page + 1,
        page_size: $scope.filterConfig.entries,
        search:    $scope.filterConfig.search,
        ordering:  ($scope.filterConfig.sortorder === 'ASC' ? '' : '-') + $scope.filterConfig.sortfield
      })
      .$promise
      .then(function (res) {
        $scope.data = res;
      })
      .catch(function (error) {
        console.log('An error occurred', error);
      });
    }, true);

    $scope.$watch('selection.item', function(selitem){
      if (selitem) {
        $state.go('volumes.detail.status', {volume: selitem.id});
      }
      else {
        $state.go('volumes');
      }
    });

    $scope.$watchCollection("selection.item", function(item){
      $scope.hasSelection = !!item;
      if( !item ){
        return;
      }
      $scope.volumeForShare = item.is_filesystemvolume;
      $scope.volumeForLun   = item.is_blockvolume && !item.is_filesystemvolume;
    });

    $scope.addAction = function(){
      console.log(["addAction", arguments]);
    }

    $scope.resizeAction = function(){
      console.log(["resizeAction", arguments]);
    }

    $scope.deleteAction = function(){
      console.log(["deleteAction", arguments]);
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
