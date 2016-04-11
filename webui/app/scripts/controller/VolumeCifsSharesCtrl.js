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
app.controller("VolumeCifsSharesCtrl", function ($scope, $state, CifsSharesService, $uibModal) {
  $scope.cifsData = {};

  $scope.cifsFilter = {
    page: 0,
    entries: 10,
    search: "",
    sortfield: null,
    sortorder: null,
    volume: null
  };

  $scope.cifsSelection = {};

  $scope.$watch("selection.item", function (selitem) {
    $scope.cifsFilter.volume = selitem;
  });

  $scope.$watch("cifsFilter", function () {
    if (!$scope.cifsFilter.volume) {
      return;
    }
    CifsSharesService.filter({
      page: $scope.cifsFilter.page + 1,
      pageSize: $scope.cifsFilter.entries,
      search: $scope.cifsFilter.search,
      ordering: ($scope.cifsFilter.sortorder === "ASC" ? "" : "-") + $scope.cifsFilter.sortfield,
      volume: $scope.cifsFilter.volume.id
    })
        .$promise
        .then(function (res) {
          $scope.cifsData = res;
        })
        .catch(function (error) {
          console.log("An error occurred", error);
        });
  }, true);

  $scope.addCifsAction = function () {
    $state.go("volumes.detail.cifs-add", {
      "#":
      "more"
    });
  };

  $scope.editCifsAction = function () {
    $state.go("volumes.detail.cifs-edit", {
      share: $scope.cifsSelection.item.id,
      "#": "more"
    });
  };

  $scope.deleteCifsAction = function () {
    var modalInstance = $uibModal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "templates/volumes/delete-cifs-share.html",
      controller: "CifsShareDeleteCtrl",
      resolve: {
        share: function () {
          return $scope.cifsSelection.item;
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.cifsFilter.refresh = new Date();
    });
  };
});