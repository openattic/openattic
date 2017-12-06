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

class CephRgwUserList {
  constructor ($state, $stateParams, $filter, $uibModal, cephRgwUserService,
      oaTabSetService, settingsFormService, Notification) {
    this.$state = $state;
    this.$stateParams = $stateParams;
    this.$filter = $filter;
    this.$uibModal = $uibModal;
    this.cephRgwUserService = cephRgwUserService;
    this.oaTabSetService = oaTabSetService;
    this.settingsFormService = settingsFormService;
    this.Notification = Notification;

    this.users = {};
    this.selection = {};
    this.error = false;
    this.filterConfig = {
      page: 0,
      entries: undefined,
      search: "",
      sortfield: undefined,
      sortorder: undefined
    };
    this.tabData = {
      active: 0,
      tabs: {
        status: {
          show: () => _.isObjectLike(this.selection.item),
          state: "ceph-rgw-users.detail.details",
          class: "tc_statusTab",
          name: "Details"
        },
        statistics: {
          show: () => _.isObjectLike(this.selection.item),
          state: "ceph-rgw-users.detail.statistics",
          class: "tc_statisticsTab",
          name: "Statistics"
        }
      }
    };
    this.tabConfig = {
      type: "ceph-rgw-users",
      linkedBy: "user_id",
      jumpTo: "more"
    };
  }

  getUserList () {
    this.error = false;

    this.cephRgwUserService.filter(this.filterConfig)
      .$promise
      .then((res) => {
        this.users = res;
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
      this.$state.go("ceph-rgw-users");
      return;
    }

    // Load the user/bucket quota of the selected user.
    this.cephRgwUserService.getQuota({"uid": items[0].user_id})
      .$promise
      .then((res) => {
        // Append the user/bucket quota.
        items[0].user_quota = res.user_quota;
        items[0].bucket_quota = res.bucket_quota;
      });

    if (this.$state.current.name === "ceph-rgw-users") {
      this.oaTabSetService.changeTab("ceph-rgw-users.detail.details", this.tabData,
        this.tabConfig, selection);
    } else {
      this.oaTabSetService.changeTab(this.$state.current.name, this.tabData,
        this.tabConfig, selection);
    }
  }

  addAction () {
    this.$state.go("ceph-rgw-user-add");
  }

  editAction () {
    this.$state.go("ceph-rgw-user-edit", {user_id: this.selection.item.user_id});
  }

  deleteAction () {
    if (!this.hasSelection && !this.multiSelection) {
      return;
    }
    // Get the settings for additional checks before deleting the selected users.
    this.settingsFormService.get()
      .$promise
      .then((res) => {
        // Check if one of the selected user is configured to access
        // the Object Gateway. If this is true, then display a warning
        // message and abort the deletion process.
        const abort = this.selection.items.some((item) => {
          return item.user_id === res.rgw.user_id;
        });
        if (abort) {
          const numUsers = this.selection.items.length;
          this.Notification.warning({
            title: (numUsers > 1) ? "Delete users" : "Delete user",
            msg: numUsers + " user(s) can not be deleted because the user '" +
              res.rgw.user_id + "' is used to access the Object Gateway."
          });
          return;
        }
        // Display the delete dialog.
        let modalInstance = this.$uibModal.open({
          windowTemplate: require("../../../templates/messagebox.html"),
          component: "cephRgwUserDeleteModal",
          resolve: {
            userSelection: () => {
              return this.selection.items;
            }
          }
        });
        modalInstance.result.then(() => {
          // Reload the user list.
          this.filterConfig.refresh = new Date();
        });
      });
  }

  listBucketsAction () {
    this.$state.go("ceph-rgw-buckets", {
      search: this.selection.item.user_id,
      sortfield: "owner"
    });
  }
}

export default {
  controller: CephRgwUserList,
  template: require("./ceph-rgw-user-list.component.html")
};
