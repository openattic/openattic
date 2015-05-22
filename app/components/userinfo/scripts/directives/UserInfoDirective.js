'use strict';

angular.module('openattic.userinfo')
  .directive('userinfo', function(){
    return {
      restrict: 'E',
      template: [
        '<div class="login-info">',
        '<span>',
        '<a ui-sref="users-edit({user:user.id})" id="show-shortcut" data-action="toggleShortcut">',
        '<span class="tc_usernameinfo" ng-bind="user.username"></span>',
        '</a>',
        '</span>',
        '</div>'
      ].join(''),
      controller: function($scope, $filter, UserService){
        UserService.current()
          .$promise
          .then(function(res) {
            $scope.user = res;
          })
          .catch(function(){
            console.log('an error occured');
          });
      }
    };
  });