angular.module('openattic')
  .controller('CmdlogCtrl', function ($scope, $state, CmdlogService) {
    'use strict';

    $scope.data = {};

    $scope.filterConfig = {
      page      : 0,
      entries   : 10,
      search    : '',
      sortfield : null,
      sortorder : null
    };

    $scope.selection = {};

    $scope.$watch('filterConfig', function(){
      CmdlogService.filter({
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
  });