'use strict';

angular.module('openattic.auth')
  .controller('authController', function ($scope, $rootScope, $state, authService) {
    $scope.fieldRequired = 'This field is required.';
    $scope.correctInput = 'The given credentials are not correct.';

    $scope.$watchGroup(['username', 'password'], function(){
      $scope.submitted = false;
    });
    $scope.login = function(){
      $scope.submitted = true;
      $scope.loginFailed = false;
      var loginData = {'username': $scope.username, 'password': $scope.password};
      authService.login(loginData, function(res){
        $rootScope.user = res;
        $state.go('dashboard');
      }, function(){
        $scope.loginFailed = true;
      });
    };
  })
  .directive('autoFocus', function($timeout){
    return {
      restrict: 'A',
      link: function($scope, $element){
        $timeout(function(){
          $element.focus();
        }, 0);
      }
    }
  });
