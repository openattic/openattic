/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (C) 2011-2016, it-novum GmbH <community@openattic.org>
 *
 *
 * The JavaScript code in this page is free software: you can
 * redistribute it and/or modify it under the terms of the GNU
 * General Public License as published by the Free Software
 * Foundation; version 2.
 *
 * This package is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * As additional permission under GNU GPL version 2 section 3, you
 * may distribute non-source (e.g., minimized or compacted) forms of
 * that code without the copy of the GNU GPL normally required by
 * section 1, provided you include this license notice and a URL
 * through which recipients can access the Corresponding Source.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this page.
 *
 */
"use strict";

var app = angular.module("openattic");
app.controller("UserFormCtrl", function ($scope, $state, $stateParams, UserService, $filter) {
  var gravatarId = $filter("gravatar")("");

  $scope.isCurrentUser = false;

  var goToListView = function () {
    $state.go("users");
  };

  if (!$stateParams.user) {
    $scope.editing = false;
    $scope.user = {
      "username": "",
      "email": "",
      "password": "",
      "first_name": "",
      "last_name": "",
      "is_active": false,
      "is_superuser": false,
      "is_staff": false
    };
    $scope.image = "http://www.gravatar.com/avatar/" + gravatarId + ".jpg?d=monsterid";

    $scope.submitAction = function (userForm) {
      $scope.submitted = true;
      if (userForm.$valid === true) {
        UserService.save($scope.user)
            .$promise
            .then(function () {
              goToListView();
            }, function (error) {
              console.log("An error occured", error);
            });
      }
    };
  } else {
    $scope.editing = true;

    UserService.get({id: $stateParams.user})
        .$promise
        .then(function (res) {
          if ($scope.user.id === Number($stateParams.user)) {
            $scope.isCurrentUser = true;
          }
          $scope.user = res;

          gravatarId = $filter("gravatar")($scope.user.email);
          $scope.image = "http://www.gravatar.com/avatar/" + gravatarId + ".jpg?d=monsterid";
        }, function (error) {
          console.log("An error occurred", error);
        });

    $scope.submitAction = function (userForm) {
      $scope.submitted = true;
      if (userForm.$valid === true) {
        UserService.update({id: $scope.user.id}, $scope.user)
            .$promise
            .then(function () {
              goToListView();
            }, function (error) {
              console.log("An error occured", error);
            });
      }
    };
  }

  $scope.cancelAction = function () {
    goToListView();
  };
});
