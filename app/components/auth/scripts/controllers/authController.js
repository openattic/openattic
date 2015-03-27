'use strict';

angular.module('openattic.auth')
  .controller('authController', function ($scope, $window, authService) {
    $scope.fieldRequired = "This field is required.";
    $scope.correctInput = "The given login informations are not correct.";

    $scope.login = function(loginForm){
      $scope.submitted = true;
      if(loginForm.$valid === true) {
        var loginData = {'username': $scope.username, 'password': $scope.password};
        authService.login(loginData)
          .$promise
          .then(function (res) {
            $scope.user = res.username;
            $window.location.href = '/openattic/angular/#/dashboard';
          })
          .catch(function () {
            loginForm.username.$setValidity('correctInput', false);
            loginForm.password.$setValidity('correctInput', false);
          });
      }
    };
  });
