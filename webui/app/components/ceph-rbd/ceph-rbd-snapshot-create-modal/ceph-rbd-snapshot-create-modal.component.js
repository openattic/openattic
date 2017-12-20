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

class CephRbdSnapshotCreateModal {

  constructor ($q, cephRbdSnapshotService) {
    this.cephRbdSnapshotService = cephRbdSnapshotService;
    this.$q = $q;

    this.name = "";
    this.editing = false;
  }

  $onInit () {
    this.name = this.resolve.snapName;
    this.isProtected = this.resolve.isProtected;

    if (this.name) {
      this.editing = true;
    }
  }

  create () {
    // Edit
    if (this.editing) {
      const request = {
        fsid: this.resolve.fsid,
        pool: this.resolve.poolName,
        imagename: this.resolve.imageName,
        snap: this.resolve.snapName,
        image: `${this.resolve.poolName}/${this.resolve.imageName}`,
        name: this.name,
        is_protected: this.isProtected
      };
      return this.$q((resolve, reject) => {
        this.cephRbdSnapshotService.update(request)
          .$promise
          .then(() => {
            resolve();
            this.modalInstance.close("snapsedited");
          }, () => {
            this.form.$submitted = false;
            reject();
          });
      });

      // Create
    } else {
      const request = {
        fsid: this.resolve.fsid,
        image: `${this.resolve.poolName}/${this.resolve.imageName}`,
        name: this.name,
        is_protected: this.isProtected
      };
      return this.$q((resolve, reject) => {
        this.cephRbdSnapshotService.create(request)
          .$promise
          .then(() => {
            resolve();
            this.modalInstance.close("snapscreated");
          }, () => {
            this.form.$submitted = false;
            reject();
          });
      });
    }

  }

  cancel () {
    this.modalInstance.dismiss("cancel");
  }
}

export default {
  template: require("./ceph-rbd-snapshot-create-modal.component.html"),
  bindings: {
    modalInstance: "<",
    resolve: "<"
  },
  controller: CephRbdSnapshotCreateModal
};
