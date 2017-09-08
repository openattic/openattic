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

import app from "../module";

app.controller("CephErasureCodeProfilesAddCtrl", function ($scope, $uibModalInstance, cephErasureCodeProfilesService,
    cluster, osd, Notification) {
  $scope.cluster = cluster;
  $scope.osdCount = osd;
  $scope.erasureCodeProfile = {
    k                     : "", // data-chunks
    m                     : "", // coding-chunks
    name                  : "",
    ruleset_failure_domain: ""
  };
  $scope.rulesetFailureDomains = undefined;

  $scope.addErasureCodeProfile = function () {
    cephErasureCodeProfilesService
      .save({
        fsid                  : $scope.cluster.fsid,
        k                     : $scope.erasureCodeProfile.k,
        m                     : $scope.erasureCodeProfile.m,
        name                  : $scope.erasureCodeProfile.name,
        ruleset_failure_domain: $scope.erasureCodeProfile.ruleset_failure_domain
      })
      .$promise
      .then(function (res) {
        Notification.success({
          title: "Erasure code profile created",
          msg  : "Erasure code profile '" + $scope.erasureCodeProfile.name + "' successfully created."
        });

        $uibModalInstance.close(res);
      });
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss("cancel");
  };

  function init () {
    cephErasureCodeProfilesService
      .getfailureDomains({
        fsid: $scope.cluster.fsid,
        ordering: "-id",
        pageSize: 1
      })
      .$promise
      .then(function (res) {
        $scope.rulesetFailureDomains = res.crushmap.types;

        angular.forEach($scope.rulesetFailureDomains, function (e) {
          if (e.name === "host") {
            $scope.erasureCodeProfile.ruleset_failure_domain = e.name;
          }
        });
      })
      .catch(function () {
        $scope.addForm.$submitted = false;
      });
  }

  init();
});
