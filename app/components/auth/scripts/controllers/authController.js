'use strict';

angular.module('openattic.auth')
  .controller('authController', function ($scope, $rootScope, $state, authService) {
    $scope.fieldRequired = 'This field is required.';
    $scope.correctInput = 'The given credentials are not correct.';

    $scope.login = function(loginForm){
      $scope.submitted = true;
      var loginData = {'username': $scope.username, 'password': $scope.password};
      authService.login(loginData, function(res){
        $rootScope.user = res;
        $state.go('dashboard');
      }, function(){
        loginForm.username.$setValidity('correctInput', false);
        loginForm.password.$setValidity('correctInput', false);
        $scope.submitted = false;
      });
    };
  });
