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

class CephRgwBucketList {
  constructor ($state, $stateParams, $filter, $uibModal, cephRgwBucketService,
      oaTabSetService, Notification) {
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.$filter = $filter;
    this.$uibModal = $uibModal;
    this.cephRgwBucketService = cephRgwBucketService;
    this.oaTabSetService = oaTabSetService;
    this.Notification = Notification;

    this.buckets = {};
    this.selection = {};
    this.error = false;
    this.filterConfig = {
      page: 0,
      entries: undefined,
      search: "",
      sortfield: "bucket",
      sortorder: "ASC"
    };
    this.tabData = {
      active: 0,
      tabs: {
        status: {
          show: () => _.isObjectLike(this.selection.item),
          state: "ceph-rgw-buckets.detail.details",
          class: "tc_statusTab",
          name: "Details"
        }
      }
    };
    this.tabConfig = {
      type: "ceph-rgw-buckets",
      linkedBy: "bucket",
      jumpTo: "more"
    };
  }

  getBucketList () {
    this.error = false;

    // Apply filter parameters given via non-URL route parameters.
    Object.keys(this.filterConfig).forEach((param) => {
      if (!_.isUndefined(this.$stateParams[param])) {
        this.filterConfig[param] = this.$stateParams[param];
      }
    });

    this.cephRgwBucketService.filter(this.filterConfig)
      .$promise
      .then((res) => {
        this.buckets = res;
      })
      .catch((error) => {
        this.error = error;
      });
  }

  onSelectionChange (selection) {
    this.selection = selection;
    let items = selection.items;

    this.multiSelection = items && items.length > 1;
    this.hasSelection = items && items.length === 1;

    if (!items || items.length !== 1) {
      this.$state.go("ceph-rgw-buckets");
      return;
    }

    if (this.$state.current.name === "ceph-rgw-buckets") {
      this.oaTabSetService.changeTab("ceph-rgw-buckets.detail.details", this.tabData,
        this.tabConfig, selection);
    } else {
      this.oaTabSetService.changeTab(this.$state.current.name, this.tabData,
        this.tabConfig, selection);
    }
  }

  addAction () {
    this.$state.go("ceph-rgw-bucket-add");
  }

  editAction () {
    this.$state.go("ceph-rgw-bucket-edit", {bucket: this.selection.item.bucket});
  }

  deleteAction () {
    if (!this.hasSelection && !this.multiSelection) {
      return;
    }
    // Check if the selected buckets are referenced.
    if (this.selection.items && this.selection.items.length > 0) {
      const selectionIsReferenced = this.selection.items.some((item) => {
        return item.is_referenced;
      });
      if (selectionIsReferenced) {
        const numBuckets = this.selection.items.length;
        this.Notification.warning({
          title: (numBuckets > 1) ? "Delete buckets" : "Delete bucket",
          msg: numBuckets + " bucket(s) can not be deleted because they are shared via NFS."
        });
        return;
      }
    }
    let modalInstance = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "cephRgwBucketDeleteModal",
      resolve: {
        bucketSelection: () => {
          return this.selection.items;
        }
      }
    });
    modalInstance.result.then(() => {
      // Reload the bucket list.
      this.filterConfig.refresh = new Date();
    });
  }
}

export default {
  controller: CephRgwBucketList,
  template: require("./ceph-rgw-bucket-list.component.html")
};
