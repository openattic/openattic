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
app.controller("CephIscsiTargetSettingsModalCtrl", function ($scope, $uibModalInstance, model,
    CEPH_ISCSI_TARGET_ADVANCED_SETTINGS) {

  $scope.model = model;
  $scope.CEPH_ISCSI_TARGET_ADVANCED_SETTINGS = CEPH_ISCSI_TARGET_ADVANCED_SETTINGS;

  $scope.targetSettings = angular.copy(model.targetSettings);

  $scope.confirm = function () {
    angular.forEach($scope.targetSettings, function (value, key) {
      if (value === "" || value === null) {
        delete $scope.targetSettings[key];
      }
    });
    $scope.model.targetSettings = $scope.targetSettings;
    $uibModalInstance.close("confirmed");
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss("cancel");
  };

});
