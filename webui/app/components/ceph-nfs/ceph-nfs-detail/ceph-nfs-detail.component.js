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

class CephNfsDetail {
  constructor (cephNfsFsal, cephNfsAccessType) {
    this.cephNfsFsal = cephNfsFsal;
    this.cephNfsAccessType = cephNfsAccessType;
  }

  getFsalDesc (fsal) {
    let fsalItem = this.cephNfsFsal.find((currentFsalItem) => {
      if (fsal === currentFsalItem.value) {
        return currentFsalItem;
      }
    });
    return _.isObjectLike(fsalItem) ? fsalItem.descr : fsal;
  }

  getAccessTypeHelp (accessType) {
    let accessTypeItem = this.cephNfsAccessType.find((currentAccessTypeItem) => {
      if (accessType === currentAccessTypeItem.value) {
        return currentAccessTypeItem;
      }
    });
    return _.isObjectLike(accessTypeItem) ? accessTypeItem.help : "";
  }

  getMountCommand () {
    if (this.selection.item) {
      let device = this.selection.item.pseudo || this.selection.item.tag || this.selection.item.path || "";
      return `# mount.nfs ${this.selection.item.host}:${device} /mnt`;
    }
    return "";
  }
}

export default {
  template: require("./ceph-nfs-detail.component.html"),
  bindings: {
    selection: "<"
  },
  controller: CephNfsDetail
};
