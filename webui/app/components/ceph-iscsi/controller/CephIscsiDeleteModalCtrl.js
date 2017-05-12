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
app.controller("CephIscsiDeleteModalCtrl", function ($scope, cephIscsiService, $uibModalInstance,
    iscsiTargetSelection, fsid, $q, Notification) {
  $scope.iscsiTargets = iscsiTargetSelection;
  $scope.deleteFormSubmitted = false;

  $scope.delete = function () {
    var targetIds = [];
    $scope.iscsiTargets.forEach(function (isciTarget) {
      targetIds.push(isciTarget.targetId);
    });
    cephIscsiService.bulk_delete({
      fsid: fsid,
      targetIds: targetIds
    })
    .$promise
    .then(function () {
      $uibModalInstance.close("deleted");
      Notification.success({
        msg: $scope.iscsiTargets.length > 1 ? "Targets have been deleted" : "Target has been deleted"
      });
    }, function () {
      // See https://tracker.openattic.org/browse/OP-2114
      $scope.deleteForm.$submitted = false;
      $uibModalInstance.close("deleted");
    });
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss("cancel");

    Notification.warning({
      title: "Cancelled deletion",
      msg: "Cancelled iSCSI target deletion"
    });
  };
});
