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

class CephErasureCodeProfilesAddComponent {

  constructor (cephErasureCodeProfilesService, Notification) {
    this.cephErasureCodeProfilesService = cephErasureCodeProfilesService;
    this.Notification = Notification;
    this.erasureCodeProfile = {
      k: "", // data-chunks
      m: "", // coding-chunks
      name: "",
      ruleset_failure_domain: ""
    };
    this.rulesetFailureDomains = undefined;
  }

  $onInit () {
    this.cluster = this.resolve.cluster;
    this.osdCount = this.resolve.osd;

    this.cephErasureCodeProfilesService
      .getfailureDomains({
        fsid: this.cluster.fsid,
        ordering: "-id",
        pageSize: 1
      })
      .$promise
      .then((res) => {
        this.rulesetFailureDomains = res.crushmap.types;

        this.rulesetFailureDomains.forEach((e) => {
          if (e.name === "host") {
            this.erasureCodeProfile.ruleset_failure_domain = e.name;
          }
        });
      })
      .catch(() => {
        this.addForm.$submitted = false;
      });
  }

  addErasureCodeProfile () {
    this.cephErasureCodeProfilesService
      .save({
        fsid: this.cluster.fsid,
        k: this.erasureCodeProfile.k,
        m: this.erasureCodeProfile.m,
        name: this.erasureCodeProfile.name,
        ruleset_failure_domain: this.erasureCodeProfile.ruleset_failure_domain
      })
      .$promise
      .then((res) => {
        this.Notification.success({
          title: "Erasure code profile created",
          msg  : "Erasure code profile '" + this.erasureCodeProfile.name + "' successfully created."
        });

        this.modalInstance.close(res);
      });
  }

  cancel () {
    this.modalInstance.dismiss("cancel");
  }
}

export default {
  controller: CephErasureCodeProfilesAddComponent,
  template: require("./ceph-erasure-code-profiles-add.component.html"),
  bindings: {
    modalInstance: "<",
    resolve: "<"
  }
};
