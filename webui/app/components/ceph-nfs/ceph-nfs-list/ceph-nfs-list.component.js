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

var app = angular.module("openattic.cephNfs");
app.component("cephNfsList", {
  templateUrl: "components/ceph-nfs/ceph-nfs-list/ceph-nfs-list.component.html",
  bindings: {
    cluster: "<"
  },
  controller: function ($scope, $filter, $state, $uibModal, $timeout, registryService, oaTabSetService,
      cephNfsService, taskQueueService, taskQueueSubscriber, cephNfsStateService, cephNfsFsal) {
    var self = this;

    this.registry = registryService;

    this.nfs = {};
    this.error = false;

    this.filterConfig = {
      page     : 0,
      entries  : 10,
      search   : "",
      sortfield: null,
      sortorder: null
    };

    this.selection = {};

    self.tabData = {
      active: 0,
      tabs: {
        status: {
          show: "$ctrl.selection.item",
          state: "cephNfs.detail.details",
          class: "tc_detailsTab",
          name: "Details"
        }
      }
    };

    self.tabConfig = {
      type: "cephNfs",
      linkedBy: "id",
      jumpTo: "more"
    };

    $scope.$watch("$ctrl.filterConfig", function (newValue, oldValue) {
      if (angular.equals(newValue, oldValue)) {
        return;
      }
      self.getNfsList();
    }, true);

    $scope.$watchCollection("$ctrl.selection", function (selection) {
      var items = selection.items;
      self.multiSelection = items && items.length > 1;
      self.hasSelection = items && items.length === 1;
      if (!items || items.length !== 1) {
        $state.go("cephNfs");
        return;
      }
      if ($state.current.name === "cephNfs") {
        oaTabSetService.changeTab("cephNfs.detail.details", self.tabData, self.tabConfig, selection);
      } else {
        oaTabSetService.changeTab($state.current.name, self.tabData, self.tabConfig, selection);
      }
    });

    var updateStates = function () {
      angular.forEach(self.nfs.results, function (nfsExport) {
        nfsExport.state = "LOADING";
      });
      cephNfsStateService.updateStates(self.registry.selectedCluster.fsid, function (hostsToUpdate) {
        angular.forEach(self.nfs.results, function (nfsExport) {
          var currentHost = hostsToUpdate[nfsExport.host];
          if (angular.isDefined(currentHost)) {
            if (angular.isDefined(currentHost.exports) &&
                angular.isDefined(currentHost.exports[nfsExport.exportId])) {
              nfsExport.state = currentHost.exports[nfsExport.exportId].state;
            } else {
              nfsExport.state = currentHost.state;
            }
          }
        });
      });
    };

    self.onClusterLoad = function (cluster) {
      self.cluster = cluster;
    };

    self.getNfsList = function () {
      if (angular.isObject(self.cluster) && self.cluster.results &&
          self.cluster.results.length > 0 && self.registry.selectedCluster) {
        var obj = $filter("filter")(self.cluster.results, {fsid: self.registry.selectedCluster.fsid}, true);
        if (obj.length === 0) {
          self.registry.selectedCluster = self.cluster.results[0];
        }
        self.nfs = {};
        self.error = false;
        cephNfsService
          .get({
            fsid: self.registry.selectedCluster.fsid,
            page: self.filterConfig.page + 1,
            pageSize: self.filterConfig.entries,
            search: self.filterConfig.search,
            ordering: (self.filterConfig.sortorder === "ASC" ? "" : "-") + self.filterConfig.sortfield
          })
          .$promise
          .then(function (res) {
            self.nfs = res;
            updateStates();
          })
          .catch(function (error) {
            self.error = error;
          });
      }
    };

    self.getFsalDesc = function (fsal) {
      var fsalItem = cephNfsFsal.find(function (currentFsalItem) {
        if (fsal === currentFsalItem.value) {
          return currentFsalItem;
        }
      });
      return angular.isDefined(fsalItem) ? fsalItem.descr : fsal;
    };

    self.addAction = function () {
      $state.go("cephNfs-add", {
        fsid: self.registry.selectedCluster.fsid
      });
    };

    self.editAction = function () {
      $state.go("cephNfs-edit", {
        fsid: self.registry.selectedCluster.fsid,
        host: self.selection.items[0].host,
        exportId: self.selection.items[0].exportId
      });
    };

    self.deleteAction = function () {
      if (!self.hasSelection && !self.multiSelection) {
        return;
      }
      var modalInstance = $uibModal.open({
        windowTemplateUrl: "templates/messagebox.html",
        component: "cephNfsDeleteModal",
        resolve: {
          fsid: function () {
            return self.registry.selectedCluster.fsid;
          },
          selectionItems: function () {
            return self.selection.items;
          }
        }
      });
      modalInstance.result.then(function () {
        self.filterConfig.refresh = new Date();
      });
    };

    self.cloneAction = function () {
      $state.go("cephNfs-clone", {
        fsid: self.registry.selectedCluster.fsid,
        host: self.selection.items[0].host,
        exportId: self.selection.items[0].exportId
      });
    };

    self.stateAction = function () {
      var modalInstance = $uibModal.open({
        windowTemplateUrl: "templates/messagebox.html",
        component: "cephNfsManageServiceModal",
        resolve: {
          fsid: function () {
            return self.registry.selectedCluster.fsid;
          }
        }
      });
      modalInstance.result.catch(function () {
        updateStates();
      });
    };
  }
});
