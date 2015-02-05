angular.module('openattic')
  .controller('VolumeCtrl', function ($scope, $stateParams, $state, VolumeService) {
    'use strict';
    $scope.stateParams = $stateParams;

    $scope.data = {};

    $scope.filterConfig = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: 'name',
      sortorder: 'ASC'
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
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
