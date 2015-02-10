angular.module('openattic')
  .controller('UserCtrl', function ($scope, $state, UserService) {
    'use strict';

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
      UserService.filter({
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

    $scope.$watchCollection("selection.item", function(item){
      $scope.hasSelection = !!item;
    });

    $scope.addAction = function(){
      $state.go("users.add");
    }

    $scope.editAction = function(){
      $state.go("users.edit", {user: $scope.selection.item.id});
    }

    $scope.deleteAction = function(){
      console.log(["deleteAction", arguments]);
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
