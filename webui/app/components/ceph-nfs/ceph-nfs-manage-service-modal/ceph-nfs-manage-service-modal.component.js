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

var app = angular.module("openattic.cephNfs");
app.component("cephNfsManageServiceModal", {
  templateUrl: "components/ceph-nfs/ceph-nfs-manage-service-modal/ceph-nfs-manage-service-modal.component.html",
  bindings: {
    modalInstance: "<",
    resolve: "<"
  },
  controller: function ($timeout, cephNfsService, taskQueueSubscriber, $cacheFactory, cephNfsStateService, $filter) {

    var self = this;

    var updateStates = function () {
      angular.forEach(self.hostnames, function (hostname) {
        if (angular.isUndefined(self.hosts[hostname])) {
          self.hosts[hostname] = {};
        }
        self.hosts[hostname].state = "LOADING";
      });
      cephNfsStateService.updateStates(self.resolve.fsid, function (hostsToUpdate) {
        angular.forEach(self.hosts, function (host, hostname) {
          var hostToUpdate = hostsToUpdate[hostname];
          if (angular.isDefined(hostToUpdate)) {
            host.state = hostToUpdate.state;
            host.messages = [];
            angular.forEach(hostToUpdate.exports, function (exportItem) {
              if (exportItem.state === "INACTIVE" && angular.isDefined(exportItem.message)) {
                host.messages.push(exportItem.message);
              }
            });
          }
        });
      });
    };

    self.hosts = undefined;
    cephNfsService.hosts({
      fsid: self.resolve.fsid
    })
      .$promise
      .then(function (res) {
        self.hosts = {};
        self.hostnames = $filter("orderBy")(res.hosts);
        updateStates();
      });

    var dirty = false;

    self.start = function (hostname) {
      dirty = true;
      cephNfsStateService.start(self.hosts[hostname], hostname, self.resolve.fsid);
    };

    self.stop = function (hostname) {
      dirty = true;
      cephNfsStateService.stop(self.hosts[hostname], hostname, self.resolve.fsid);
    };

    self.close = function () {
      if (dirty) {
        self.modalInstance.dismiss("close");
      } else {
        self.modalInstance.close("close");
      }
    };
  }
});
