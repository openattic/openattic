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

class CephPoolsList {
  constructor ($state, $filter, cephPoolsService, registryService,
      $uibModal, oaTabSetService) {
    this.$filter = $filter;
    this.$state = $state;
    this.$uibModal = $uibModal;
    this.cephPoolsService = cephPoolsService;
    this.oaTabSetService = oaTabSetService;
    this.registry = registryService;

    this.cluster = undefined;
    this.pools = {};
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
        details: {
          show: () => _.isObjectLike(this.selection.item),
          state: "cephPools.detail.details",
          class: "tc_detailsTab",
          name: "Details"
        },
        cacheTier: {
          show: () => {
            return _.isObjectLike(this.selection.item) &&
              this.selection.item.tiers.length > 0;
          },
          state: "cephPools.detail.cacheTier",
          class: "tc_cacheTieringTab",
          name: "Cache Tier"
        },
        statistics: {
          show: () => _.isObjectLike(this.selection.item),
          state: "cephPools.detail.statistics",
          class: "tc_statisticsTab",
          name: "Statistics"
        }
      }
    };
    this.tabConfig = {
      type: "cephPool",
      linkedBy: "id",
      jumpTo: "more"
    };
  }

  modifyResult (res) {
    res.results.forEach(pool => {
      pool.oaUnused = 100 - pool.percent_used;
      pool.oaFree = pool.max_avail - pool.num_bytes;
      pool.application_metadata = Object.keys(pool.application_metadata).sort();
      pool.showApps = pool.application_metadata.join(", ");
    });
    return res;
  }

  onClusterLoad (cluster) {
    this.cluster = cluster;
  }

  getPoolList () {
    if (_.isObjectLike(this.cluster) && this.cluster.results &&
        this.cluster.results.length > 0 && this.registry.selectedCluster) {
      let obj = this.$filter("filter")(this.cluster.results, {fsid: this.registry.selectedCluster.fsid}, true);
      if (obj.length === 0) {
        this.registry.selectedCluster = this.cluster.results[0];
      }

      this.pools = {};
      this.error = false;

      this.cephPoolsService
        .get({
          fsid    : this.registry.selectedCluster.fsid,
          page    : this.filterConfig.page + 1,
          pageSize: this.filterConfig.entries,
          search  : this.filterConfig.search,
          ordering: (this.filterConfig.sortorder === "ASC" ? "" : "-") + this.filterConfig.sortfield
        })
        .$promise
        .then((res) => {
          this.pools = this.modifyResult(res);
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

    this.multiSelection = Boolean(items) && items.length > 1;
    this.hasSelection = Boolean(item);

    if (!item && !items) {
      this.$state.go("cephPools");
      return;
    }

    if (item) {
      if (this.$state.current.name === "cephPools") {
        this.oaTabSetService.changeTab("cephPools.detail.details", this.tabData,
          this.tabConfig, selection);
      } else {
        this.oaTabSetService.changeTab(this.$state.current.name, this.tabData,
          this.tabConfig, selection);
      }
    }
  }

  addAction () {
    this.$state.go("ceph-pools-add", {
      fsid: this.registry.selectedCluster.fsid
    });
  }

  editAction () {
    this.$state.go("ceph-pools-edit", {
      fsid: this.selection.item.cluster,
      poolId: this.selection.item.id
    });
  }

  deleteAction () {
    if (!this.hasSelection && !this.multiSelection) {
      return;
    }
    let modalInstance = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephPoolsDeleteModal",
      resolve: {
        cephPoolSelection: () => {
          return this.selection.items;
        }
      }
    });

    modalInstance.result.then(() => {
      this.filterConfig.refresh = new Date();
    });
  }
}

export default{
  template: require("./ceph-pools-list.component.html"),
  controller: CephPoolsList
};
