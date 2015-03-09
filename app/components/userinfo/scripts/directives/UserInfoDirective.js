'use strict';

angular.module('openattic.userinfo')
  .directive('userinfo', function(){
    return {
      restrict: 'E',
      template: [
        '<div class="login-info">',
        '<span>',
        '<a ui-sref="users-edit({user:user.id})" id="show-shortcut" data-action="toggleShortcut">',
        '<img src="http://www.gravatar.com/avatar/{{ user.email | gravatar }}.jpg?d=monsterid" alt="me" style="border-left: 0px;"/>',
        '<span ng-bind="user.username"></span>',
        '</a>',
        '</span>',
        '</div>'
      ].join(''),
      controller: function($scope, UserService){
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