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
app.controller("HttpShareDeleteCtrl", function ($scope, HttpSharesService, $uibModalInstance, share, toasty) {
  $scope.share = share;

  $scope.delete = function () {
    HttpSharesService.delete({id: $scope.share.id})
        .$promise
        .then(function () {
          $uibModalInstance.close("deleted");
        }, function (error) {
          console.log("An error occured", error);
        });
  };

  $scope.cancel = function () {
    $uibModalInstance.dismiss("cancel");

    toasty.warning({
      title: "Delete share",
      msg: "Cancelled"
    });
  };
});