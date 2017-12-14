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

class CephNfsFormClient {

  constructor (cephNfsAccessType, cephNfsSquash) {
    this.cephNfsAccessType = cephNfsAccessType;
    this.cephNfsSquash = cephNfsSquash;
  }

  addClient (clientBlock) {
    clientBlock.clients.push("");
    setTimeout(() => {
      let clientsInputs = jQuery("#clients input");
      clientsInputs[clientsInputs.length - 1].focus();
    });
  }

  getNoAccessTypeDescr (clientBlock) {
    if (!clientBlock.accessType && this.accessType) {
      return this.accessType + " (inherited from global config)";
    }
    return "-- Select the access type --";
  }

  getAccessTypeHelp (accessType) {
    let accessTypeItem = this.cephNfsAccessType.find((currentAccessTypeItem) => {
      if (accessType === currentAccessTypeItem.value) {
        return currentAccessTypeItem;
      }
    });
    return _.isObjectLike(accessTypeItem) ? accessTypeItem.help : "";
  }

  getNoSquashDescr (clientBlock) {
    if (!clientBlock.squash && this.squash) {
      return this.squash + " (inherited from global config)";
    }
    return "-- Select what kind of user id squashing is performed --";
  }

  removeClientBlock (index) {
    this.clientBlocks.splice(index, 1);
  }

  addClientBlock () {
    this.clientBlocks.push({
      clients: "",
      accessType: "",
      squash: ""
    });
    setTimeout(() => {
      jQuery("#clients" + (this.clientBlocks.length - 1)).focus();
    });
  }
}

export default {
  template: require("./ceph-nfs-form-client.component.html"),
  bindings: {
    clientBlocks: "<",
    form: "<",
    accessType: "<",
    squash: "<"
  },
  controller: CephNfsFormClient
};
