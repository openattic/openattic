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

var app = angular.module("openattic.shared");
app.component("oaCephModuleLoader", {
  templateUrl: "components/shared/oa-ceph-module-loader/oa-ceph-module-loader.component.html",
  bindings: {
    module: "@",
    cluster: "<",
    registry: "=",
    onClusterChange: "&"
  },
  transclude: true,
  controller: function (oaCephModuleLoaderService) {
    var self = this;

    self.$onInit = function () {
      self.loadModule();
    };

    self.loadModule = function (triggerOnClusterChange) {
      if (angular.isDefined(self.module)) {
        if (angular.isUndefined(self.cluster) || self.cluster.results.length > 0) {
          self.moduleAvailable = undefined;
          var fsid = self.registry && self.registry.selectedCluster ? self.registry.selectedCluster.fsid : undefined;
          oaCephModuleLoaderService.get({
            module: self.module,
            fsid: fsid
          })
          .$promise
          .then(function (res) {
            self.moduleAvailable = res;
            if (self.moduleAvailable.available && triggerOnClusterChange) {
              self.onClusterChange();
            }
          });
        }
      } else {
        self.moduleAvailable = {
          $resolved: true,
          available: true
        };
        if (triggerOnClusterChange) {
          self.onClusterChange();
        }
      }
    };

    var reasons = {
      "100": {
        title: "Unexpected error",
        template: "unknown"
      },
      "101": {
        title: "DeepSea - Connection failed",
        template: "deepsea-conn-unknown-problem"
      },
      "102": {
        title: "DeepSea - Connection refused",
        template: "deepsea-connection-refused"
      },
      "103": {
        title: "DeepSea - Unknown host",
        template: "deepsea-unknown-host"
      },
      "104": {
        title: "DeepSea - Connection timeout",
        template: "deepsea-connection-timeout"
      },
      "105": {
        title: "DeepSea - No route to host",
        template: "deepsea-no-route-to-host"
      },
      "106": {
        title: "DeepSea - Authentication failed",
        template: "deepsea-failed-authentication"
      },
      "107": {
        title: "DeepSea - Internal server error",
        template: "deepsea-internal-server-error"
      },
      "108": {
        title: "DeepSea - Unexpected response",
        template: "deepsea-http-problem"
      },
      "120": {
        title: "DeepSea - NFS - Unexpected error",
        template: "deepsea-nfs-unknown-problem"
      },
      "121": {
        title: "DeepSea - NFS - Runner error",
        template: "deepsea-nfs-runner-error"
      },
      "122": {
        title: "DeepSea - NFS - No suitable hosts found",
        template: "deepsea-nfs-no-hosts"
      },
      "123": {
        title: "DeepSea - NFS - No suitable storage backend found",
        template: "deepsea-nfs-no-fsals"
      },
      "131": {
        title: "openATTIC - CephFS connection failure",
        template: "openattic-nfs-no-cephfs"
      },
      "132": {
        title: "openATTIC - Ceph Object Store connection failure",
        template: "openattic-nfs-no-rgw"
      },
      "140": {
        title: "DeepSea - iSCSI - Unexpected error",
        template: "deepsea-iscsi-unknown-problem"
      },
      "141": {
        title: "DeepSea - iSCSI - Runner error",
        template: "deepsea-iscsi-runner-error"
      },
      "142": {
        title: "DeepSea - iSCSI - No Interfaces",
        template: "deepsea-iscsi-no-interfaces"
      },
      "151": {
        title: "Ceph - No connection",
        template: "openattic-ceph-no-connection"
      },
      "152": {
        title: "Ceph - No cluster found",
        template: "openattic-ceph-no-cluster-found"
      },
      "160": {
        title: "Object Gateway - Connection failed",
        template: "rgw-conn-unknown-problem"
      },
      "161": {
        title: "Object Gateway - Connection refused",
        template: "rgw-connection-refused"
      },
      "163": {
        title: "Object Gateway - Unknown host",
        template: "rgw-unknown-host"
      },
      "164": {
        title: "Object Gateway - Connection timeout",
        template: "rgw-connection-timeout"
      },
      "165": {
        title: "Object Gateway - No route to host",
        template: "rgw-no-route-to-host"
      },
      "166": {
        title: "Object Gateway - Authentication failed",
        template: "rgw-failed-authentication"
      },
      "167": {
        title: "Object Gateway - Internal server error",
        template: "rgw-internal-server-error"
      },
      "168": {
        title: "Object Gateway - Unexpected response",
        template: "rgw-http-problem"
      },
      "169": {
        title: "Object Gateway - Not a system user",
        template: "rgw-not-system-user"
      },
      "171": {
        title: "Object Gateway - No connection",
        template: "openattic-rgw-no-deepsea-conn"
      },
      "172": {
        title: "Object Gateway - DeepSea - No connection",
        template: "openattic-rgw-no-deepsea-cred"
      }
    };

    self.getErrorTitle = function (reason) {
      if (angular.isDefined(reasons[reason])) {
        return reasons[reason].title;
      }
      return "Error";
    };

    self.getErrorTemplate = function (reason) {
      if (angular.isDefined(reasons[reason])) {
        return "components/shared/oa-ceph-module-loader/reason-" + reason + "-" + reasons[reason].template + ".html";
      }
      return "components/shared/oa-ceph-module-loader/reason-default.html";
    };

  }
});
