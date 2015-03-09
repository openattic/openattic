'use strict';

angular.module('openattic.userinfo')
  .directive('userinfo', function(){
    return {
      restrict: 'E',
      template: [
        '<div class="login-info">',
        '<span>',
        '<a ui-sref="users-edit({user:user.id})" id="show-shortcut" data-action="toggleShortcut">',
        '<img ng-src="{{image}}" style="border-left: 0px;"/>',
        '<span ng-bind="user.username"></span>',
        '</a>',
        '</span>',
        '</div>'
      ].join(''),
      controller: function($scope, $filter, UserService){
        UserService.current()
          .$promise
          .then(function(res) {
            $scope.user = res;

            var gravatarId = $filter('gravatar')($scope.user.email);
            $scope.image = 'http://www.gravatar.com/avatar/' + gravatarId + '.jpg?d=monsterid';
          })
          .catch(function(){
            console.log('an error occured');
          });
      }
    };
  });