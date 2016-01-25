"use strict";

var app = angular.module("openattic.userinfo");
app.directive("userinfo", function () {
  return {
    restrict: "E",
    template: [
      "<div class=\"login-info\">",
      "<span>",
      "<a ui-sref=\"users-edit({user:user.id})\" id=\"show-shortcut\" data-action=\"toggleShortcut\">",
      "<span class=\"tc_usernameinfo\" ng-if=\"user.first_name === '' && user.last_name === ''\" ",
          "ng-bind=\"user.username\"></span>",
      "<span class=\"tc_usernameinfo\" ng-if=\"user.first_name !== '' || user.last_name !== ''\" ",
          "ng-bind=\"user.first_name + ' ' + user.last_name\"></span>",
      "</a>",
      "</span>",
      "</div>"
    ].join(""),
    controller: function ($rootScope, UserService) {
      UserService.current()
      .$promise
      .then(function (res) {
        $rootScope.user = res;
      })
      .catch(function () {
        console.log("an error occured");
      });
    }
  };
});
