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

class CephNodesList {
  constructor ($state, $uibModal, cephNodesService, oaTabSetService) {
    this.oaTabSetService = oaTabSetService;
    this.cephNodesService = cephNodesService;
    this.$state = $state;
    this.$uibModal = $uibModal;

    this.data = {};

    this.filterConfig = {
      page: 0,
      entries: null,
      search: "",
      sortfield: null,
      sortorder: null
    };

    this.selection = {};

    this.tabData = {
      active: 0,
      tabs: {
        details: {
          show: () => _.isObjectLike(this.selection.item),
          state: "cephNodes.detail.details",
          class: "tc_detailsTab",
          name: "Details"
        },
        statistics: {
          show: () => _.isObjectLike(this.selection.item),
          state: "cephNodes.detail.statistics",
          class: "tc_statisticsTab",
          name: "Statistics"
        }
      }
    };
    this.tabConfig = {
      type: "cephNodes",
      linkedBy: "id",
      jumpTo: "more"
    };

    this.error = false;
  }

  $onInit () {
    this.getNodes();
  }

  getNodes () {
    this.error = false;

    this.cephNodesService.filter({
      page: this.filterConfig.page + 1,
      pageSize: this.filterConfig.entries,
      search: this.filterConfig.search,
      ordering: (this.filterConfig.sortorder === "ASC" ? "" : "-") + this.filterConfig.sortfield
    })
      .$promise
      .then((res) => {
        this.data = res;
      })
      .catch((error) => {
        this.error = error;
      });
  }

  onSelectionChange (selection) {
    this.selection = selection;

    var item = selection.item;
    var items = selection.items;

    this.multiSelection = Boolean(items) && items.length > 1;
    this.hasSelection = Boolean(item);

    if (!items || items.length !== 1) {
      this.$state.go("cephNodes");
      return;
    }

    this.oaTabSetService.changeTab("cephNodes.detail.details", this.tabData,
      this.tabConfig, selection);
  }

  scrubAction (deep) {
    if (!(this.hasSelection || this.multiSelection)) {
      return;
    }
    var modalInstance = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "CephNodesScrubModal",
      resolve: {
        cephNodes: () => {
          return this.selection.items;
        },
        deep: () => {
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
  controller: CephNodesList,
  template: require("./ceph-nodes-list.component.html")
};
