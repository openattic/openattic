/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2017 SUSE LLC
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

var app = angular.module("openattic.cephRgw");
app.controller("CephRgwUserAddEditSwiftKeyModalCtrl", function ($scope, $uibModalInstance,
    cephRgwHelpersService, user, index) {
  $scope.user = user;

  if (!angular.isNumber(index)) {
    $scope.editing = false;
    $scope.key = {};

    $scope.submitAction = function (form) {
      if (form.$valid === true) {
        $uibModalInstance.close({
          "action": "add",
          "data": $scope.key
        });
      }
    };

    // Check if user already exists.
    $scope.$watch("key.user", function (user) {
      if (!angular.isString(user) || (user === "")) {
        return;
      }
      angular.forEach($scope.user.swift_keys, function (key) {
        $scope.form.user.$setValidity("uniqueuser", key.user !== user);
      });
    });
  } else {
    $scope.editing = true;
    $scope.key = angular.copy($scope.user.swift_keys[index]);
  }

  /**
   * Get a list of subusers that should be displayed.
   */
  $scope.enumKeySubuserCandidates = function () {
    var result = [];
    if ($scope.editing) {
      result.push($scope.key.user);
    } else {
      result = cephRgwHelpersService.enumKeyUserCandidates($scope.user, "swift");
    }
    return result;
  };

  $scope.cancelAction = function () {
    $uibModalInstance.dismiss("close");
  };
});
