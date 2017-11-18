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
      cephIscsiImageAdvangedSettings, cephIscsiTargetAdvangedSettings,
      cephIscsiStateService) {
    this.cephIscsiService = cephIscsiService;
    this.cephIscsiTargetAdvangedSettings = cephIscsiTargetAdvangedSettings;
    this.$state = $state;
    this.$uibModal = $uibModal;
    this.$filter = $filter;
    this.registry = registryService;
    this.oaTabSetService = oaTabSetService;
    this.cephIscsiStateService = cephIscsiStateService;
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

    this.tabData = {
      active: 0,
      tabs: {
        status: {
          show: () => _.isObjectLike(this.selection.item),
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

  onClusterLoad (cluster) {
    this.cluster = cluster;
  }

  getIscsiList () {
    if (_.isObjectLike(this.cluster) && this.cluster.results &&
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
          this.iscsi.results.forEach((target) => {
            target.allIscsiImageSettings = this.allIscsiImageSettings;
            target.cephIscsiTargetAdvangedSettings = this.cephIscsiTargetAdvangedSettings;
            target.fsid = this.registry.selectedCluster.fsid;
          });
          this.cephIscsiStateService.update(this.registry.selectedCluster.fsid, this.iscsi.results);
        })
        .catch((error) => {
          this.error = error;
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

  stateAction () {
    let modalInstance = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephIscsiManageServiceModal",
      resolve: {
        fsid: () => {
          return this.registry.selectedCluster.fsid;
        }
      }
    });
    modalInstance.result.catch(() => {
      this.cephIscsiStateService.update(this.registry.selectedCluster.fsid, this.iscsi.results);
    });
  }
}

export default {
  template: require("./ceph-iscsi-list.component.html"),
  controller: CephIscsiList
};
