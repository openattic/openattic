angular.module('openattic')
  .controller('VolumeLunsCtrl', function ($scope, $stateParams, LunsService) {
    'use strict';
    $scope.lunsData = {};

    $scope.lunsFilter = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: null,
      sortorder: null,
      volume: null
    };

    $scope.lunsSelection = {
    };

    $scope.$watch('selection.item', function(selitem){
      $scope.lunsFilter.volume = selitem;
    });

    $scope.$watch('lunsFilter', function(){
      if(!$scope.lunsFilter.volume){
        return;
      }
      LunsService.filter({
        page:      $scope.lunsFilter.page + 1,
        page_size: $scope.lunsFilter.entries,
        search:    $scope.lunsFilter.search,
        ordering:  ($scope.lunsFilter.sortorder === 'ASC' ? '' : '-') + $scope.lunsFilter.sortfield,
        volume:    $scope.lunsFilter.volume.id
      })
      .$promise
      .then(function (res) {
        $scope.lunsData = res;
      })
      .catch(function (error) {
        console.log('An error occurred', error);
      });
    }, true);
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
