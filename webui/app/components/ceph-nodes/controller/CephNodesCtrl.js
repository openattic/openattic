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

var app = angular.module("openattic.cephNodes");
app.controller("CephNodesCtrl", function ($scope, $state, $uibModal,
    cephNodesService, oaTabSetService) {
  $scope.data = {};

  $scope.filterConfig = {
    page: 0,
    entries: null,
    search: "",
    sortfield: null,
    sortorder: null
  };

  $scope.selection = {};

  $scope.tabData = {
    active: 0,
    tabs: {
      details: {
        show: "$ctrl.selection.item",
        state: "cephNodes.detail.details",
        class: "tc_detailsTab",
        name: "Details"
      },
      statistics: {
        show: "$ctrl.selection.item",
        state: "cephNodes.detail.statistics",
        class: "tc_statisticsTab",
        name: "Statistics"
      }
    }
  };
  $scope.tabConfig = {
    type: "cephNodes",
    linkedBy: "id",
    jumpTo: "more"
  };

  $scope.error = false;

  $scope.getNodes = function () {
    $scope.error = false;

    cephNodesService.filter({
      page: $scope.filterConfig.page + 1,
      pageSize: $scope.filterConfig.entries,
      search: $scope.filterConfig.search,
      ordering: ($scope.filterConfig.sortorder === "ASC" ? "" : "-") + $scope.filterConfig.sortfield
    })
      .$promise
      .then(function (res) {
        $scope.data = res;
      })
      .catch(function (error) {
        $scope.error = error;
      });
  };

  // Watcher
  $scope.$watch("filterConfig", function (newVal) {
    if (newVal.entries === null) {
      return;
    }
    $scope.getNodes();
  }, true);

  $scope.onSelectionChange = function (selection) {
    $scope.selection = selection;

    var item = selection.item;
    var items = selection.items;

    $scope.multiSelection = Boolean(items) && items.length > 1;
    $scope.hasSelection = Boolean(item);

    if (!items || items.length !== 1) {
      $state.go("cephNodes");
      return;
    }

    oaTabSetService.changeTab("cephNodes.detail.details", $scope.tabData,
      $scope.tabConfig, selection);
  };

  $scope.scrubAction = function (deep) {
    if (!($scope.hasSelection || $scope.multiSelection)) {
      return;
    }
    var modalInstance = $uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "CephNodesScrubModal",
      resolve: {
        cephNodes: function () {
          return $scope.selection.items;
        },
        deep: function () {
          return deep;
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.filterConfig.refresh = new Date();
    });
  };
});
