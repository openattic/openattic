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

class CephNodesScrubModal {

  constructor (cephNodesService, $q) {
    this.cephNodesService = cephNodesService;
    this.$q = $q;
  }

  scrub () {
    let nodes = this.resolve.cephNodes.map((cephNode) => {
      return cephNode.hostname;
    });

    return this.$q((resolve, reject) => {
      if (nodes.length === 1) {
        this.cephNodesService
          .scrub({
            "hostname": nodes[0],
            "deep-scrub": this.resolve.deep
          })
          .$promise
          .then(() => {
            resolve();
            this.modalInstance.close("scrubbed");
          }, () => {
            reject();
            this.modalInstance.close("rejected");
          });
      } else {
        this.cephNodesService
          .scrub_many({
            "hostnames": nodes,
            "deep-scrub": this.resolve.deep
          })
          .$promise
          .then(() => {
            resolve();
            this.modalInstance.close("scrubbed");
          }, () => {
            reject();
            this.modalInstance.close("rejected");
          });
      }
    });
  }

  cancel () {
    this.modalInstance.dismiss("cancel");
  }
}

export default {
  template: require("./ceph-nodes-scrub-modal.component.html"),
  bindings: {
    modalInstance: "<",
    resolve: "<"
  },
  controller: CephNodesScrubModal
};
