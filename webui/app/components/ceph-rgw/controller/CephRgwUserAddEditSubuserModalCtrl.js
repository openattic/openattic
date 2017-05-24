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
app.controller("CephRgwUserAddEditSubuserModalCtrl", function ($scope, $uibModalInstance,
    cephRgwHelpersService, user, index) {
  $scope.user = user;

  if (!angular.isNumber(index)) {
    $scope.editing = false;
    $scope.subuser = {};

    $scope.submitAction = function (form) {
      if (form.$valid === true) {
        $uibModalInstance.close({
          "action": "add",
          "data": $scope.subuser
        });
      }
    };

    // Check if subuser already exists.
    $scope.$watch("subuser.subuser", function (subuserId) {
      if (!angular.isString(subuserId) || (subuserId === "")) {
        return;
      }
      angular.forEach($scope.user.subusers, function (subuser) {
        $scope.form.subuser.$setValidity("uniquesubuser",
          cephRgwHelpersService.getSubuserName(subuser.id) !== subuserId);
      });
    });
  } else {
    $scope.editing = true;
    $scope.subuser = angular.copy($scope.user.subusers[index]);

    // Modify the subuser data.
    $scope.subuser.subuser = cephRgwHelpersService.getSubuserName($scope.subuser.id);

    $scope.submitAction = function (form) {
      if (form.$valid === true) {
        $uibModalInstance.close({
          "action": "modify",
          "data": $scope.subuser
        });
      }
    };
  }

  $scope.cancelAction = function () {
    $uibModalInstance.dismiss("close");
  };
});
