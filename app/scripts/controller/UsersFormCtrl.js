angular.module('openattic')
  .controller('UserFormCtrl', function ($scope, $state, $stateParams, UserService, $filter) {
    'use strict';

    var gravatarId = $filter('gravatar')('');

    if(!$stateParams.user){
      $scope.user = {'active': true};
      $scope.editing = false;

      $scope.image = 'http://www.gravatar.com/avatar/' + gravatarId + '.jpg?d=monsterid';

      $scope.submitAction = function(userForm) {
        $scope.submitted = true;
        if(userForm.$valid === true) {
          UserService.save($scope.user)
            .$promise
            .then(function () {
              goToListView();
            }, function (error) {
              console.log('An error occured', error);
            });
        }
      };
    }
    else {
      $scope.editing = true;

      UserService.get({id: $stateParams.user})
        .$promise
        .then(function(res){
          $scope.user = res;

          gravatarId = $filter('gravatar')($scope.user.email);
          $scope.image = 'http://www.gravatar.com/avatar/' + gravatarId + '.jpg?d=monsterid';
        }, function(error){
          console.log('An error occurred', error);
        });

      $scope.submitAction = function(userForm) {
        $scope.submitted = true;
        if(userForm.$valid === true) {
          UserService.update({id: $scope.user.id}, $scope.user)
            .$promise
            .then(function () {
              goToListView();
            }, function (error) {
              console.log('An error occured', error);
            });
        }
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
