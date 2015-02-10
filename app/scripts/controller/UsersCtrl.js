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

    $scope.$watchCollection('selection.item', function(item){
      $scope.hasSelection = !!item;
    });

    $scope.addAction = function(){
      $state.go('users.add');
    }

    $scope.editAction = function(){
      $state.go('users.edit', {user: $scope.selection.item.id});
    }

    $scope.deleteAction = function(){
      $.SmartMessageBox({
        title: 'Delete user',
        content: 'Do you really want to delete the user "' + $scope.selection.item.username + '"?',
        buttons: '[No][Yes]'
      }, function (ButtonPressed) {
        if (ButtonPressed === 'Yes') {
          UserService.delete({id: $scope.selection.item.id})
            .$promise
            .then(function() {
              $scope.filterConfig.refresh = new Date();
            }, function(error){
              console.log('An error occured', error);
            });
        }
        if (ButtonPressed === 'No') {
          $.smallBox({
            title: 'Delete user',
            content: '<i class="fa fa-clock-o"></i> <i>Cancelled</i>',
            color: '#C46A69',
            iconSmall: 'fa fa-times fa-2x fadeInRight animated',
            timeout: 4000
          });
        }
      });
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
