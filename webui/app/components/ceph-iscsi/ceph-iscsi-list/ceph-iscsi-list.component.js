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
app.component("cephIscsiList", {
  template: require("./ceph-iscsi-list.component.html"),
  controller: function ($scope, $state, $filter, $timeout, $uibModal, registryService,
      oaTabSetService, cephIscsiService, cephIscsiImageOptionalSettings, cephIscsiImageAdvangedSettings,
      cephIscsiTargetAdvangedSettings, Notification) {

    let self = this;

    self.registry = registryService;
    self.cluster = undefined;
    self.iscsi = {};
    self.error = false;

    let allIscsiImageSettings = cephIscsiImageOptionalSettings.concat(cephIscsiImageAdvangedSettings);

    self.filterConfig = {
      page     : 0,
      entries  : 10,
      search   : "",
      sortfield: null,
      sortorder: null
    };

    self.selection = {};

    self.deployed = {
      $resolved: false,
      deployed: undefined
    };

    self.deployIscsi = function () {
      self.deployed.$resolved = false;
      cephIscsiService
        .iscsideploy({
          fsid: self.registry.selectedCluster.fsid
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
          self.deployed = res;
        });
    };

    self.undeployIscsi = function () {
      self.deployed.$resolved = false;
      cephIscsiService
        .iscsiundeploy({
          fsid: self.registry.selectedCluster.fsid
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
          self.deployed = res;
        });
    };

    self.onClusterLoad = function (cluster) {
      self.cluster = cluster;
      self.getIscsiList();
    };

    self.getIscsiList = function () {
      if (angular.isObject(self.cluster) && self.cluster.results &&
          self.cluster.results.length > 0 && self.registry.selectedCluster) {
        var obj = $filter("filter")(self.cluster.results, {
          fsid: self.registry.selectedCluster.fsid
        }, true);
        if (obj.length === 0) {
          self.registry.selectedCluster = self.cluster.results[0];
        }

        self.iscsi = {};
        self.error = false;

        cephIscsiService
          .get({
            fsid: self.registry.selectedCluster.fsid,
            page: self.filterConfig.page + 1,
            pageSize: self.filterConfig.entries,
            search: self.filterConfig.search,
            ordering: (self.filterConfig.sortorder === "ASC" ? "" : "-") + self.filterConfig.sortfield
          })
          .$promise
          .then(function (res) {
            self.iscsi = res;
            angular.forEach(self.iscsi.results, function (target) {
              target.allIscsiImageSettings = allIscsiImageSettings;
              target.cephIscsiTargetAdvangedSettings = cephIscsiTargetAdvangedSettings;
              target.fsid = self.registry.selectedCluster.fsid;
            });
          })
          .catch(function (error) {
            self.error = error;
          });

        cephIscsiService
          .iscsistatus({
            fsid: self.registry.selectedCluster.fsid
          })
          .$promise
          .then(function (res) {
            self.deployed = res;
          });
      }
    };

    self.tabData = {
      active: 0,
      tabs: {
        status: {
          show: "$ctrl.selection.item",
          state: "cephIscsi.detail.details",
          class: "tc_statusTab",
          name: "Status"
        }
      }
    };
    self.tabConfig = {
      type: "cephIscsi",
      linkedBy: "id",
      jumpTo: "more"
    };

    $scope.$watch("$ctrl.filterConfig", function (newValue, oldValue) {
      if (angular.equals(newValue, oldValue)) {
        return;
      }
      self.getIscsiList();
    }, true);

    self.onSelectionChange = function (selection) {
      self.selection = selection;
      var items = selection.items;

      self.multiSelection = items && items.length > 1;
      self.hasSelection = items && items.length === 1;
      if (!items || items.length !== 1) {
        $state.go("cephIscsi");
        return;
      }
      if ($state.current.name === "cephIscsi") {
        oaTabSetService.changeTab("cephIscsi.detail.details", self.tabData, self.tabConfig, selection);
      } else {
        oaTabSetService.changeTab($state.current.name, self.tabData, self.tabConfig, selection);
      }
    };

    self.addAction = function () {
      $state.go("cephIscsi-add", {
        fsid: self.registry.selectedCluster.fsid
      });
    };

    self.deleteAction = function () {
      if (!self.hasSelection && !self.multiSelection) {
        return;
      }
      var modalInstance = $uibModal.open({
        windowTemplate: require("../../../templates/messagebox.html"),
        component: "cephIscsiDeleteModal",
        resolve: {
          fsid: function () {
            return self.registry.selectedCluster.fsid;
          },
          iscsiTargetSelection: function () {
            return self.selection.items;
          }
        }
      });

      modalInstance.result.then(function () {
        self.filterConfig.refresh = new Date();
      });
    };

    self.editAction = function () {
      $state.go("cephIscsi-edit", {
        fsid: self.registry.selectedCluster.fsid,
        targetId: self.selection.items[0].targetId
      });
    };

    self.cloneAction = function () {
      $state.go("cephIscsi-clone", {
        fsid: self.registry.selectedCluster.fsid,
        targetId: self.selection.items[0].targetId
      });
    };

  }
});
