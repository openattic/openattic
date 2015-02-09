angular.module('openattic')
  .controller('PoolCtrl', function ($scope, $stateParams, $state, PoolService) {
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
      PoolService.filter({
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
        $state.go('pools.detail.status', {pool: selitem.id});
      }
      else {
        $state.go('pools');
      }
    });

    $scope.$watchCollection("selection.item", function(item){
      $scope.hasSelection = !!item;
    });

    $scope.addAction = function(){
      console.log(["addAction", arguments]);
    }

    $scope.deleteAction = function(){
      console.log(["deleteAction", arguments]);
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
