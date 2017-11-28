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

class CephNfsManageServiceModal {

  constructor (cephNfsService, cephNfsStateService, $filter) {
    this.cephNfsService = cephNfsService;
    this.cephNfsStateService = cephNfsStateService;
    this.$filter = $filter;

    this.hosts = undefined;
    this._dirty = false;
  }

  $onInit () {
    this.cephNfsService.hosts({
      fsid: this.resolve.fsid
    })
      .$promise
      .then((res) => {
        this.hosts = {};
        this.hostnames = this.$filter("orderBy")(res.hosts);
        this._updateStates();
      });
  }

  _updateStates () {
    this.hostnames.forEach((hostname) => {
      if (_.isUndefined(this.hosts[hostname])) {
        this.hosts[hostname] = {};
      }
      this.hosts[hostname].state = "LOADING";
    });
    this.cephNfsStateService.updateStates(this.resolve.fsid, (hostsToUpdate) => {
      _.forIn(this.hosts, (host, hostname) => {
        let hostToUpdate = hostsToUpdate[hostname];
        if (_.isObjectLike(hostToUpdate)) {
          host.state = hostToUpdate.state;
          host.messages = [];
          _.forIn(hostToUpdate.exports, (exportItem) => {
            if (exportItem.state === "INACTIVE" && _.isString(exportItem.message)) {
              host.messages.push(exportItem.message);
            }
          });
        }
      });
    });
  }

  start (hostname) {
    this._dirty = true;
    this.cephNfsStateService.start(this.hosts[hostname], hostname, this.resolve.fsid);
  }

  stop (hostname) {
    this._dirty = true;
    this.cephNfsStateService.stop(this.hosts[hostname], hostname, this.resolve.fsid);
  }

  close () {
    if (this._dirty) {
      this.modalInstance.dismiss("close");
    } else {
      this.modalInstance.close("close");
    }
  }

}

export default {
  template: require("./ceph-nfs-manage-service-modal.component.html"),
  bindings: {
    modalInstance: "<",
    resolve: "<"
  },
  controller: CephNfsManageServiceModal
};
