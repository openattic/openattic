angular.module('openattic')
  .controller('DiskCtrl', function ($scope, $state, DiskService) {
    'use strict';

    $scope.data = {};

    $scope.filterConfig = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: null,
      sortorder: null
    };

    $scope.selection = {};

    $scope.$watch('filterConfig', function(){
      DiskService.filter({
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
        $state.go('disks.detail.status', {disk: selitem.id});
      }
      else {
        $state.go('disks');
      }
    });

    $scope.$watchCollection('selection.item', function(item){
      $scope.hasSelection = !!item;
    });

    $scope.createPoolAction = function(){
      console.log("createPoolAction");
      $state.go('pools-add', {diskId: $scope.selection.item.id});
    };
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
