angular.module('openattic')
  .controller('UserFormCtrl', function ($scope, $state, $stateParams, UserService) {
    if(!$stateParams.user){
      $scope.user = {"active": true};
      $scope.userAction = 'Create User:';

      $scope.submitAction = function() {
        $scope.user.app = 'auth';
        $scope.user.obj = 'User';

        UserService.save($scope.user)
          .$promise
          .then(function() {
              goToListView();
          }, function(error) {
              console.log('An error occured', error);
          });
      }
    }
    else {
        $scope.userAction = 'Edit User:';

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
        }
    }

    $scope.cancelAction = function() {
        goToListView();
    }

    var goToListView = function() {
        $state.go('app.users');
    }
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
