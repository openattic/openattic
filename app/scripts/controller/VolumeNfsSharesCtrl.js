angular.module('openattic')
  .controller('VolumeNfsSharesCtrl', function ($scope, NfsSharesService) {
    'use strict';

    $scope.nfsData = {};

    $scope.nfsFilter = {
      page: 0,
      entries: 10,
      search: '',
      sortfield: null,
      sortorder: null,
      volume: null
    };

    $scope.nfsSelection = {
    };

    $scope.$watch('selection.item', function(selitem){
      $scope.nfsFilter.volume = selitem;
    });

    $scope.$watch('nfsFilter', function(){
      if(!$scope.nfsFilter.volume){
        return;
      }
      NfsSharesService.filter({
        page:      $scope.nfsFilter.page + 1,
        page_size: $scope.nfsFilter.entries,
        search:    $scope.nfsFilter.search,
        ordering:  ($scope.nfsFilter.sortorder === 'ASC' ? '' : '-') + $scope.nfsFilter.sortfield,
        volume:    $scope.nfsFilter.volume.id
      })
      .$promise
      .then(function (res) {
        $scope.nfsData = res;
      })
      .catch(function (error) {
        console.log('An error occurred', error);
      });
    }, true);

    $scope.addNfsAction = function(){
      console.log(["addNfsAction", arguments]);
    }

    $scope.deleteNfsAction = function(){
      console.log(["deleteNfsAction", arguments]);
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
