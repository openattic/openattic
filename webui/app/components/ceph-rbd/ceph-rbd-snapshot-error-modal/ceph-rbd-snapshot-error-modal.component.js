/**
 *
 * @source: http://bitbucket.org/openattic/openattic
 *
 * @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 * Copyright (c) 2018 SUSE LLC
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

class CephRbdSnapshotErrorModal {

  constructor (cephRbdSnapshotValidationErrors) {
    this.cephRbdSnapshotValidationErrors = cephRbdSnapshotValidationErrors;
  }

  $onInit () {
    this.validationError = this.resolve.validationError;

    if (this.validationError === this.cephRbdSnapshotValidationErrors.deleteProtected) {
      this.errorHeading = "Unable to delete snapshot";
      this.errorMsg = "Protected snapshots cannot be deleted.";

    } else if (this.validationError === this.cephRbdSnapshotValidationErrors.protectWithChilden) {
      this.errorHeading = "Unable to unprotect snapshot";
      this.errorMsg = "Snapshot unprotection is only available for snapshots without children images.";

    } else if (this.validationError === this.cephRbdSnapshotValidationErrors.unprotectWithoutLayering) {
      this.errorHeading = "Unable to protect snapshot";
      this.errorMsg = "Snapshot protection is only available for RBD images with \"Layering\" enabled.";

    } else if (this.validationError === this.cephRbdSnapshotValidationErrors.cloneUnprotected) {
      this.errorHeading = "Unable to clone snapshot";
      this.errorMsg = "RBD snapshot must be protected.";
    }
  }

  cancel () {
    this.modalInstance.dismiss("cancel");
  }
}

export default {
  template: require("./ceph-rbd-snapshot-error-modal.component.html"),
  bindings: {
    modalInstance: "<",
    resolve: "<"
  },
  controller: CephRbdSnapshotErrorModal
};
