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

class UsersListComponent {
  constructor ($state, usersService, $uibModal) {
    this.usersService = usersService;
    this.$uibModal = $uibModal;
    this.$state = $state;

    this.data = {};
    this.selection = {};
    this.hasSelection = false;

    this.filterConfig = {
      page: 0,
      entries: null,
      search: "",
      sortfield: null,
      sortorder: null
    };
  }

  addAction () {
    this.$state.go("users-add");
  }

  editAction () {
    this.$state.go("users-edit", {user: this.selection.item.id});
  }

  deleteAction () {
    let modalInstance = this.$uibModal.open({
      windowTemplate: require("../../../templates/messagebox.html"),
      component: "usersDeleteModalComponent",
      resolve: {
        user: () => {
          return this.selection.item;
        }
      }
    });
    modalInstance.result.then(() => {
      this.filterConfig.refresh = new Date();
    });
  }

  onSelectionChange (selection) {
    this.hasSelection = selection.items && selection.items.length === 1;
  }

  onFilterConfigChange () {
    this.usersService.filter({
      page: this.filterConfig.page + 1,
      pageSize: this.filterConfig.entries,
      search: this.filterConfig.search,
      ordering: (this.filterConfig.sortorder === "ASC" ? "" : "-") + this.filterConfig.sortfield
    })
      .$promise
      .then((res) => {
        this.data = res;
      });
  }
}

export default {
  controller: UsersListComponent,
  template: require("./users-list.component.html")
};
