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

var app = angular.module("openattic.cephOsd");
app.controller("CephOsdCtrl", function ($scope, $state, $filter, $uibModal,
    cephOsdService, registryService) {
  $scope.registry = registryService;
  $scope.cluster = undefined;
  $scope.osd = {};
  $scope.error = false;

  $scope.filterConfig = {
    page     : 0,
    entries  : 10,
    search   : "",
    sortfield: null,
    sortorder: null
  };

  $scope.selection = {};

  $scope.onClusterLoad = function (cluster) {
    $scope.cluster = cluster;
  };

  $scope.getOsdList = function () {
    if (angular.isObject($scope.cluster) && $scope.cluster.results &&
        $scope.cluster.results.length > 0 && $scope.registry.selectedCluster) {
      var obj = $filter("filter")($scope.cluster.results, {fsid: $scope.registry.selectedCluster.fsid}, true);
      if (obj.length === 0) {
        $scope.registry.selectedCluster = $scope.cluster.results[0];
      }

      $scope.osd = {};
      $scope.error = false;

      cephOsdService
        .get({
          fsid    : $scope.registry.selectedCluster.fsid,
          page    : $scope.filterConfig.page + 1,
          pageSize: $scope.filterConfig.entries,
          search  : $scope.filterConfig.search,
          ordering: ($scope.filterConfig.sortorder === "ASC" ? "" : "-") + $scope.filterConfig.sortfield
        })
        .$promise
        .then(function (res) {
          $scope.osd = res;
        })
        .catch(function (error) {
          $scope.error = error;
        });
    }
  };

  $scope.$watch("filterConfig", function (newValue, oldValue) {
    if (angular.equals(newValue, oldValue)) {
      return;
    }

    $scope.getOsdList();
  }, true);

  $scope.onSelectionChange = function (selection) {
    $scope.selection = selection;

    var items = selection.items;

    if (!items || items.length !== 1) {
      $state.go("cephOsds");
      return;
    }

    $state.go("cephOsds.statistics", {
      "#": "more"
    });
  };

  $scope.configureClusterAction = function () {
    $uibModal.open({
      windowTemplateUrl: "templates/messagebox.html",
      component: "cephClusterSettingsModal",
      resolve: {
        fsid: function () {
          return $scope.registry.selectedCluster.fsid;
        }
      }
    });
  };
});
