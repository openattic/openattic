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
app.controller("CephRgwUserAddEditCapabilityModalCtrl", function ($scope, $uibModalInstance, user, index) {
  $scope.user = user;

  if (!angular.isNumber(index)) {
    $scope.editing = false;
    $scope.cap = {};

    $scope.submitAction = function (form) {
      if (form.$valid === true) {
        $uibModalInstance.close({
          "action": "add",
          "data": $scope.cap
        });
      }
    };
  } else {
    $scope.editing = true;
    $scope.cap = angular.copy($scope.user.caps[index]);

    $scope.submitAction = function (form) {
      if (form.$valid === true) {
        $uibModalInstance.close({
          "action": "modify",
          "data": $scope.cap
        });
      }
    };
  }

  /**
   * Get a list of types that should be displayed.
   */
  $scope.enumTypes = function () {
    var result = [];
    if ($scope.editing) {
      result.push($scope.cap.type);
    } else {
      var usedTypes = [];
      angular.forEach($scope.user.caps, function (cap) {
        usedTypes.push(cap.type);
      });
      angular.forEach(["users", "buckets", "metadata", "usage", "zone"], function (type) {
        if (usedTypes.indexOf(type) < 0) {
          result.push(type);
        }
      });
    }
    return result;
  };

  $scope.cancelAction = function () {
    $uibModalInstance.dismiss("close");
  };
});
