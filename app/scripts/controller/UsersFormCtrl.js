angular.module('openattic')
  .controller('UserFormCtrl', function ($scope, $state, $stateParams, UserService) {
    'use strict';

    if(!$stateParams.user){
      $scope.user = {'active': true};
      $scope.editing = false;

      $scope.submitAction = function() {
        UserService.save($scope.user)
          .$promise
          .then(function() {
            goToListView();
          }, function(error) {
            console.log('An error occured', error);
          });
      };
    }
    else {
      $scope.editing = true;

      UserService.get({id: $stateParams.user})
        .$promise
        .then(function(res){
          $scope.user = res;
        }, function(error){
          console.log('An error occurred', error);
        });

      $scope.submitAction = function() {
        UserService.update({id: $scope.user.id}, $scope.user)
          .$promise
          .then(function() {
            goToListView();
          }, function(error){
            console.log('An error occured', error);
          });
      };
    }

    $scope.cancelAction = function() {
      goToListView();
    };

    var goToListView = function() {
      $state.go('users');
    };
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
