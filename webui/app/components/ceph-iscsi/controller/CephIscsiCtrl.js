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
app.controller("CephIscsiCtrl", function ($scope, $state, $filter, $timeout, $uibModal, clusterData, registryService,
    tabViewService, cephIscsiService, CEPH_ISCSI_IMAGE_OPTIONAL_SETTINGS, CEPH_ISCSI_IMAGE_ADVANCED_SETTINGS,
    CEPH_ISCSI_TARGET_ADVANCED_SETTINGS, Notification) {

  $scope.registry = registryService;
  $scope.cluster = clusterData;
  $scope.iscsi = {};
  $scope.error = false;

  var ALL_ISCSI_IMAGE_SETTINGS = CEPH_ISCSI_IMAGE_OPTIONAL_SETTINGS.concat(CEPH_ISCSI_IMAGE_ADVANCED_SETTINGS);

  $scope.filterConfig = {
    page     : 0,
    entries  : 10,
    search   : "",
    sortfield: null,
    sortorder: null
  };

  $scope.selection = {};

  if ($scope.cluster.results.length > 0 && typeof $scope.registry.selectedCluster === "undefined") {
    $scope.registry.selectedCluster = $scope.cluster.results[0];
  }

  $scope.deployed = {
    $resolved: false,
    deployed: undefined
  };

  $scope.deployIscsi = function () {
    $scope.deployed.$resolved = false;
    cephIscsiService
      .iscsideploy({
        fsid: $scope.registry.selectedCluster.fsid
      })
      .$promise
      .then(function (res) {
        if (res.result) {
          Notification.success({
            msg: "iSCSI targets started successfully"
          });
          res.status = true;
        } else {
          Notification.error({
            msg: "Failed to start iSCSI targets"
          });
          res.status = false;
        }
        $scope.deployed = res;
      });
  };

  $scope.undeployIscsi = function () {
    $scope.deployed.$resolved = false;
    cephIscsiService
      .iscsiundeploy({
        fsid: $scope.registry.selectedCluster.fsid
      })
      .$promise
      .then(function (res) {
        if (res.result) {
          Notification.success({
            msg: "iSCSI targets stopped successfully"
          });
          res.status = false;
        } else {
          Notification.error({
            msg: "Failed to stop iSCSI targets"
          });
          res.status = true;
        }
        $scope.deployed = res;
      });
  };

  $scope.getIscsiList = function () {
    if ($scope.cluster.results.length > 0 && $scope.registry.selectedCluster) {
      var obj = $filter("filter")($scope.cluster.results, {fsid: $scope.registry.selectedCluster.fsid}, true);
      if (obj.length === 0) {
        $scope.registry.selectedCluster = $scope.cluster.results[0];
      }

      $scope.iscsi = {};
      $scope.error = false;

      cephIscsiService
        .get({
          fsid: $scope.registry.selectedCluster.fsid,
          page: $scope.filterConfig.page + 1,
          pageSize: $scope.filterConfig.entries,
          search: $scope.filterConfig.search,
          ordering: ($scope.filterConfig.sortorder === "ASC" ? "" : "-") + $scope.filterConfig.sortfield
        })
        .$promise
        .then(function (res) {
          $scope.iscsi = res;
          angular.forEach($scope.iscsi.results, function (target) {
            target.ALL_ISCSI_IMAGE_SETTINGS = ALL_ISCSI_IMAGE_SETTINGS;
            target.CEPH_ISCSI_TARGET_ADVANCED_SETTINGS = CEPH_ISCSI_TARGET_ADVANCED_SETTINGS;
            target.fsid = $scope.registry.selectedCluster.fsid;
          });
        })
        .catch(function (error) {
          $scope.error = error;
        });

      cephIscsiService
        .iscsistatus({
          fsid: $scope.registry.selectedCluster.fsid
        })
        .$promise
        .then(function (res) {
          $scope.deployed = res;
        });
    }
  };

  $scope.tabData = {
    active: 0,
    tabs: {
      status: {
        show: "selection.item",
        state: "cephIscsi.detail.details",
        class: "tc_statusTab",
        name: "Status"
      }
    }
  };
  $scope.tabConfig = {
    type: "cephIscsi",
    linkedBy: "id",
    jumpTo: "more"
  };
  tabViewService.setScope($scope);

  var changeTab = tabViewService.changeTab;

  $scope.$watch("filterConfig", function (newValue, oldValue) {
    if (angular.equals(newValue, oldValue)) {
      return;
    }
    $scope.getIscsiList();
  }, true);

  $scope.$watchCollection("selection.items", function (items) {
    $scope.multiSelection = items && items.length > 1;
    $scope.hasSelection = items && items.length === 1;
    if (!items || items.length !== 1) {
      $state.go("cephIscsi");
      return;
    }
    if ($state.current.name === "cephIscsi") {
      changeTab("cephIscsi.detail.details");
    } else {
      changeTab($state.current.name);
    }
  });

  $scope.addAction = function () {
    $state.go("cephIscsi-add", {
      fsid: $scope.registry.selectedCluster.fsid
    });
  };

  $scope.deleteAction = function () {
    if (!$scope.hasSelection && !$scope.multiSelection) {
      return;
    }
    var modalInstance = $uibModal.open({
      windowTemplateUrl: "templates/messagebox.html",
      templateUrl: "components/ceph-iscsi/templates/delete-modal.html",
      controller: "CephIscsiDeleteModalCtrl",
      resolve: {
        fsid: function () {
          return $scope.registry.selectedCluster.fsid;
        },
        iscsiTargetSelection: function () {
          return $scope.selection.items;
        }
      }
    });

    modalInstance.result.then(function () {
      $scope.filterConfig.refresh = new Date();
    });
  };

  $scope.editAction = function () {
    $state.go("cephIscsi-edit", {
      fsid: $scope.registry.selectedCluster.fsid,
      targetId: $scope.selection.items[0].targetId
    });
  };

  $scope.cloneAction = function () {
    $state.go("cephIscsi-clone", {
      fsid: $scope.registry.selectedCluster.fsid,
      targetId: $scope.selection.items[0].targetId
    });
  };
});