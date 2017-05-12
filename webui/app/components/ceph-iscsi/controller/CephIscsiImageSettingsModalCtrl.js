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

var app = angular.module("openattic.cephIscsi");
app.controller("CephIscsiImageSettingsModalCtrl", function ($scope, $uibModalInstance, image,
    CEPH_ISCSI_IMAGE_ADVANCED_SETTINGS) {

  $scope.image = image;
  $scope.CEPH_ISCSI_IMAGE_ADVANCED_SETTINGS = CEPH_ISCSI_IMAGE_ADVANCED_SETTINGS;

  $scope.settings = angular.copy(image.settings);

  $scope.advancedSettingsEnabled = CEPH_ISCSI_IMAGE_ADVANCED_SETTINGS.some(function (value) {
    return $scope.settings.hasOwnProperty(value.property);
  });

  $scope.confirm = function () {
    angular.forEach($scope.settings, function (value, key) {
      if (value === "" || value === null) {
        delete $scope.settings[key];
      } else if (key === "retry_errors" && angular.isString($scope.settings[key])) {
        $scope.settings[key] = angular.fromJson("[" + value + "]");
      }
    });
    if (!$scope.advancedSettingsEnabled) {
      angular.forEach(CEPH_ISCSI_IMAGE_ADVANCED_SETTINGS, function (value) {
        delete $scope.settings[value.property];
      });
    }
    $scope.image.settings = $scope.settings;
    $uibModalInstance.close("confirmed");
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss("cancel");
  };

});
