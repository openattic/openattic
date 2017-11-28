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

class CephNfsList {

  constructor ($filter, $state, $uibModal, registryService, oaTabSetService,
      cephNfsService, cephNfsStateService, cephNfsFsal) {
    this.$filter = $filter;
    this.$state = $state;
    this.$uibModal = $uibModal;
    this.registry = registryService;
    this.oaTabSetService = oaTabSetService;
    this.cephNfsService = cephNfsService;
    this.cephNfsStateService = cephNfsStateService;
    this.cephNfsFsal = cephNfsFsal;

    this.cluster = undefined;
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

    this.tabData = {
      active: 0,
      tabs: {
        status: {
          show: () => _.isObjectLike(this.selection.item),
          state: "cephNfs.detail.details",
          class: "tc_detailsTab",
          name: "Details"
        }
      }
    };

    this.tabConfig = {
      type: "cephNfs",
      linkedBy: "id",
      jumpTo: "more"
    };
  }

  onSelectionChange (selection) {
    const items = selection.items;
    this.multiSelection = items && items.length > 1;
    this.hasSelection = items && items.length === 1;
    if (!items || items.length !== 1) {
      this.$state.go("cephNfs");
      return;
    }
    if (this.$state.current.name === "cephNfs") {
      this.oaTabSetService.changeTab("cephNfs.detail.details", this.tabData, this.tabConfig, selection);
    } else {
      this.oaTabSetService.changeTab(this.$state.current.name, this.tabData, this.tabConfig, selection);
    }
  }

  onClusterLoad (cluster) {
    this.cluster = cluster;
  }

  _updateStates () {
    _.forEach(this.nfs.results, (nfsExport) => {
      nfsExport.state = "LOADING";
    });
    this.cephNfsStateService.updateStates(this.registry.selectedCluster.fsid, (hostsToUpdate) => {
      _.forEach(this.nfs.results, (nfsExport) => {
        if (_.isObjectLike(hostsToUpdate)) {
          const currentHost = hostsToUpdate[nfsExport.host];
          if (_.isObjectLike(currentHost)) {
            if (_.isObjectLike(currentHost.exports) &&
                _.isObjectLike(currentHost.exports[nfsExport.exportId])) {
              nfsExport.state = currentHost.exports[nfsExport.exportId].state;
            } else {
              nfsExport.state = currentHost.state;
            }
          }
        } else {
          nfsExport.state = "UNKNOWN";
        }
      });
    });
  }

  getNfsList () {
    if (_.isObjectLike(this.cluster) && this.cluster.results &&
        this.cluster.results.length > 0 && this.registry.selectedCluster) {
      let obj = this.$filter("filter")(this.cluster.results, {
        fsid: this.registry.selectedCluster.fsid
      }, true);
      if (obj.length === 0) {
        this.registry.selectedCluster = this.cluster.results[0];
      }

      this.nfs = {};
      this.error = false;

      this.cephNfsService
        .get({
          fsid: this.registry.selectedCluster.fsid,
          page: this.filterConfig.page + 1,
          pageSize: this.filterConfig.entries,
          search: this.filterConfig.search,
          ordering: (this.filterConfig.sortorder === "ASC" ? "" : "-") + this.filterConfig.sortfield
        })
        .$promise
        .then((res) => {
          this.nfs = res;
          this._updateStates();
        })
        .catch((error) => {
          this.error = error;
        });
    }
  }

  getFsalDesc (fsal) {
    let fsalItem = this.cephNfsFsal.find((currentFsalItem) => {
      if (fsal === currentFsalItem.value) {
        return currentFsalItem;
      }
    });
    return _.isObjectLike(fsalItem) ? fsalItem.descr : fsal;
  }

  addAction () {
    this.$state.go("cephNfs-add", {
      fsid: this.registry.selectedCluster.fsid
    });
  }

  editAction () {
    this.$state.go("cephNfs-edit", {
      fsid: this.registry.selectedCluster.fsid,
      host: this.selection.items[0].host,
      exportId: this.selection.items[0].exportId
    });
  }

  deleteAction () {
    if (!this.hasSelection && !this.multiSelection) {
      return;
    }
    let modalInstance = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephNfsDeleteModal",
      resolve: {
        fsid: () => {
          return this.registry.selectedCluster.fsid;
        },
        selectionItems: () => {
          return this.selection.items;
        }
      }
    });
    modalInstance.result.then(() => {
      this.filterConfig.refresh = new Date();
    });
  }

  cloneAction () {
    this.$state.go("cephNfs-clone", {
      fsid: this.registry.selectedCluster.fsid,
      host: this.selection.items[0].host,
      exportId: this.selection.items[0].exportId
    });
  }

  stateAction () {
    let modalInstance = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephNfsManageServiceModal",
      resolve: {
        fsid: () => {
          return this.registry.selectedCluster.fsid;
        }
      }
    });
    modalInstance.result.catch(() => {
      this._updateStates();
    });
  }
}

export default {
  template: require("./ceph-nfs-list.component.html"),
  controller: CephNfsList
};
