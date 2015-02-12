'use strict';

angular.module('openattic.auth')
  .directive('logout', function(){
    return {
      template: [
        '<a title="Sign Out" ng-click="handleLogout()">',
          '<i class="fa fa-sign-out"></i>',
        '</a>'
      ].join(''),
      controller: function($scope, authService){
        $scope.handleLogout = function(){
          authService.logout()
          .$promise
          .then(function(){
            window.location="login.html";
          });
        }
      }
    };
  });

// kate: space-indent on; indent-width 2; replace-tabs on;
