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
app.controller("VolumeHttpSharesCtrl", function ($scope, $state, HttpSharesService, $modal) {
  $scope.httpData = {};

  $scope.httpFilter = {
    page: 0,
    entries: 10,
    search: "",
    sortfield: null,
    sortorder: null,
    volume: null
  };

  $scope.httpSelection = {};

  $scope.$watch("selection.item", function (selitem) {
    $scope.httpFilter.volume = selitem;
  });

  $scope.$watch("httpFilter", function () {
    if (!$scope.httpFilter.volume) {
      return;
    }
    HttpSharesService.filter({
      page: $scope.httpFilter.page + 1,
      pageSize: $scope.httpFilter.entries,
      search: $scope.httpFilter.search,
      ordering: ($scope.httpFilter.sortorder === "ASC" ? "" : "-") + $scope.httpFilter.sortfield,
      volume: $scope.httpFilter.volume.id
    })
        .$promise
        .then(function (res) {
          $scope.httpData = res;
        })
        .catch(function (error) {
          console.log("An error occurred", error);
        });
  }, true);

  $scope.addHttpAction = function () {
    $state.go("volumes.detail.http-add");
  };

  $scope.deleteHttpAction = function () {
    var modalInstance = $modal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "templates/volumes/delete-http-share.html",
      controller: "HttpShareDeleteCtrl",
      resolve: {
        share: function () {
          return $scope.httpSelection.item;
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.httpFilter.refresh = new Date();
    });
  };
});