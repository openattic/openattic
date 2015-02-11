angular.module('openattic.auth')
  .controller('authController', function ($scope, $window, authService) {
    $scope.login = function(){
      var loginData = {'username': $scope.username, 'password': $scope.password};
      authService.login(loginData)
        .$promise
        .then(function(res){
          $scope.user = res.username;
          console.log(res);
          $window.location.href = '/openattic/angular2/#/dashboard'
        })
        .catch(function(res){
          console.log(res);
          $window.location.href = '/openattic/angular2/login.html'
        });
    };
  });
