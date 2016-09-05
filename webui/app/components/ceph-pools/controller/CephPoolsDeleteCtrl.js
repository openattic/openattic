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

var app = angular.module("openattic.cephPools");
app.controller("CephPoolsDeleteCtrl", function ($scope, cephPoolsService, $uibModalInstance, cephPoolSelection,
    $q, toasty) {
  if ($.isArray(cephPoolSelection)) {
    $scope.cephPools = cephPoolSelection;
  } else {
    $scope.cephPool = cephPoolSelection;
  }

  $scope.input = {
    enteredName: "",
    pattern: "yes"
  };

  $scope.delete = function () {
    if ($scope.cephPool) {
      $scope.cephPools = [ $scope.cephPool ];
    }
    if ($scope.cephPools) {
      $scope.deletePools();
    }
  };

  $scope.deletePools = function () {
    var requests = [];
    $scope.cephPools.forEach(function (cephPool) {
      var deferred = $q.defer();
      cephPoolsService.delete({
        id: cephPool.cluster,
        poolId: cephPool.id
      }, deferred.resolve, deferred.reject);
      requests.push(deferred.promise);
    });
    $q.all(requests).then(function () {
      $uibModalInstance.close("deleted");
    }, function (error) {
      $uibModalInstance.close("deleted");
      toasty.error({
        title: "Deletion failure",
        msg: "Couldn't delete Ceph pool.",
        timeout: 10000
      });
      throw error;
    });
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss("cancel");

    toasty.warning({
      title: "Cancelled deletion",
      msg: "Cancelled Ceph pool deletion"
    });
  };
});
