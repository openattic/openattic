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

import _ from "lodash";

class CephIscsiList {
  constructor ($state, $filter, $uibModal, registryService, oaTabSetService,
      cephIscsiService, cephIscsiImageOptionalSettings, Notification,
      cephIscsiImageAdvangedSettings, cephIscsiTargetAdvangedSettings) {
    this.cephIscsiService = cephIscsiService;
    this.cephIscsiTargetAdvangedSettings = cephIscsiTargetAdvangedSettings;
    this.$state = $state;
    this.$uibModal = $uibModal;
    this.$filter = $filter;
    this.registry = registryService;
    this.oaTabSetService = oaTabSetService;
    this.Notification = Notification;

    this.cluster = undefined;
    this.iscsi = {};
    this.error = false;

    this.allIscsiImageSettings =
      cephIscsiImageOptionalSettings.concat(cephIscsiImageAdvangedSettings);

    this.filterConfig = {
      page     : 0,
      entries  : 10,
      search   : "",
      sortfield: null,
      sortorder: null
    };

    this.selection = {};

    this.deployed = {
      $resolved: false,
      deployed: undefined
    };

    this.tabData = {
      active: 0,
      tabs: {
        status: {
          show: () => _.isObject(this.selection.item),
          state: "cephIscsi.detail.details",
          class: "tc_statusTab",
          name: "Status"
        }
      }
    };
    this.tabConfig = {
      type: "cephIscsi",
      linkedBy: "id",
      jumpTo: "more"
    };
  }

  deployIscsi () {
    this.deployed.$resolved = false;
    this.cephIscsiService
      .iscsideploy({
        fsid: this.registry.selectedCluster.fsid
      })
      .$promise
      .then((res) => {
        if (res.result) {
          this.Notification.success({
            msg: "iSCSI targets started successfully"
          });
          res.status = true;
        } else {
          this.Notification.error({
            msg: "Failed to start iSCSI targets"
          });
          res.status = false;
        }
        this.deployed = res;
      });
  }

  undeployIscsi () {
    this.deployed.$resolved = false;
    this.cephIscsiService
      .iscsiundeploy({
        fsid: this.registry.selectedCluster.fsid
      })
      .$promise
      .then((res) => {
        if (res.result) {
          this.Notification.success({
            msg: "iSCSI targets stopped successfully"
          });
          res.status = false;
        } else {
          this.Notification.error({
            msg: "Failed to stop iSCSI targets"
          });
          res.status = true;
        }
        this.deployed = res;
      });
  }

  onClusterLoad (cluster) {
    this.cluster = cluster;
  }

  getIscsiList () {
    if (angular.isObject(this.cluster) && this.cluster.results &&
          this.cluster.results.length > 0 && this.registry.selectedCluster) {
      var obj = this.$filter("filter")(this.cluster.results, {
        fsid: this.registry.selectedCluster.fsid
      }, true);
      if (obj.length === 0) {
        this.registry.selectedCluster = this.cluster.results[0];
      }

      this.iscsi = {};
      this.error = false;

      this.cephIscsiService
        .get({
          fsid: this.registry.selectedCluster.fsid,
          page: this.filterConfig.page + 1,
          pageSize: this.filterConfig.entries,
          search: this.filterConfig.search,
          ordering: (this.filterConfig.sortorder === "ASC" ? "" : "-") + this.filterConfig.sortfield
        })
        .$promise
        .then((res) => {
          this.iscsi = res;
          angular.forEach(this.iscsi.results, (target) => {
            target.allIscsiImageSettings = this.allIscsiImageSettings;
            target.cephIscsiTargetAdvangedSettings = this.cephIscsiTargetAdvangedSettings;
            target.fsid = this.registry.selectedCluster.fsid;
          });
        })
        .catch((error) => {
          this.error = error;
        });

      this.cephIscsiService
        .iscsistatus({
          fsid: this.registry.selectedCluster.fsid
        })
        .$promise
        .then((res) => {
          this.deployed = res;
        });
    }
  }

  onSelectionChange (selection) {
    this.selection = selection;
    var items = selection.items;

    this.multiSelection = items && items.length > 1;
    this.hasSelection = items && items.length === 1;
    if (!items || items.length !== 1) {
      this.$state.go("cephIscsi");
      return;
    }
    if (this.$state.current.name === "cephIscsi") {
      this.oaTabSetService.changeTab("cephIscsi.detail.details", this.tabData, this.tabConfig, selection);
    } else {
      this.oaTabSetService.changeTab(this.$state.current.name, this.tabData, this.tabConfig, selection);
    }
  }

  addAction () {
    this.$state.go("cephIscsi-add", {
      fsid: this.registry.selectedCluster.fsid
    });
  }

  deleteAction () {
    if (!this.hasSelection && !this.multiSelection) {
      return;
    }
    var modalInstance = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephIscsiDeleteModal",
      resolve: {
        fsid: () => {
          return this.registry.selectedCluster.fsid;
        },
        iscsiTargetSelection: () => {
          return this.selection.items;
        }
      }
    });

    modalInstance.result.then(() => {
      this.filterConfig.refresh = new Date();
    });
  }
  editAction () {
    this.$state.go("cephIscsi-edit", {
      fsid: this.registry.selectedCluster.fsid,
      targetId: this.selection.items[0].targetId
    });
  }

  cloneAction () {
    this.$state.go("cephIscsi-clone", {
      fsid: this.registry.selectedCluster.fsid,
      targetId: this.selection.items[0].targetId
    });
  }
}

export default {
  template: require("./ceph-iscsi-list.component.html"),
  controller: CephIscsiList
};
