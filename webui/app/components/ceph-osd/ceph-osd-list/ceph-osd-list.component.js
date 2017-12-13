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

import _ from "lodash";

class CephOsdList {
  constructor ($state, $filter, $uibModal, cephOsdService, registryService) {
    this.$state = $state;
    this.$filter = $filter;
    this.$uibModal = $uibModal;
    this.cephOsdService = cephOsdService;
    this.registryService = registryService;

    this.registry = registryService;
    this.cluster = undefined;
    this.osd = {};
    this.error = false;

    this.filterConfig = {
      page     : 0,
      entries  : 10,
      search   : "",
      sortfield: null,
      sortorder: null
    };

    this.selection = {};
  }

  onClusterLoad (cluster) {
    this.cluster = cluster;
  }

  getOsdList () {
    if (_.isObjectLike(this.cluster) && this.cluster.results &&
        this.cluster.results.length > 0 && this.registry.selectedCluster) {
      let obj = this.$filter("filter")(this.cluster.results, {fsid: this.registry.selectedCluster.fsid}, true);
      if (obj.length === 0) {
        this.registry.selectedCluster = this.cluster.results[0];
      }

      this.osd = {};
      this.error = false;

      this.cephOsdService
        .get({
          fsid    : this.registry.selectedCluster.fsid,
          page    : this.filterConfig.page + 1,
          pageSize: this.filterConfig.entries,
          search  : this.filterConfig.search,
          ordering: (this.filterConfig.sortorder === "ASC" ? "" : "-") + this.filterConfig.sortfield
        })
        .$promise
        .then((res) => {
          this.osd = res;
        })
        .catch((error) => {
          this.error = error;
        });
    }
  }

  onSelectionChange (selection) {
    this.selection = selection;

    let item = selection.item;
    let items = selection.items;
    this.hasSelection = Boolean(item);

    if (!items || items.length !== 1) {
      this.$state.go("cephOsds");
      return;
    }

    this.$state.go("cephOsds.statistics", {
      "#": "more"
    });
  }

  configureClusterAction () {
    this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephClusterSettingsModal",
      resolve: {
        fsid: () => {
          return this.registry.selectedCluster.fsid;
        }
      }
    });
  }

  scrubAction (deep) {
    if (!this.hasSelection) {
      return;
    }
    let modalInstance = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephOsdScrubModal",
      resolve: {
        osd: () => {
          return this.selection.item;
        },
        deep:  () => {
          return deep;
        }
      }
    });

    modalInstance.result.then(() => {
      this.filterConfig.refresh = new Date();
    });
  }
}

export default {
  template: require("./ceph-osd-list.component.html"),
  controller: CephOsdList
};
