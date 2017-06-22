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
app.component("oaModuleLoader", {
  templateUrl: "components/shared/oa-module-loader/oa-module-loader.component.html",
  bindings: {
    module: "@"
  },
  transclude: true,
  controller: function (oaModuleLoaderService) {
    var self = this;

    self.moduleAvailable = undefined;

    self.$onInit = function () {
      oaModuleLoaderService.get({
        module: self.module
      })
      .$promise
      .then(function (res) {
        self.moduleAvailable = res;
      });
    };

    var reasons = {
      "100": "unknown",
      "101": "deepsea-conn-unknown-problem",
      "102": "deepsea-connection-refused",
      "103": "deepsea-unknown-host",
      "104": "deepsea-connection-timeout",
      "105": "deepsea-no-route-to-host",
      "106": "deepsea-failed-authentication",
      "107": "deepsea-internal-server-error",
      "108": "deepsea-http-problem",
      "120": "deepsea-nfs-unknown-problem",
      "121": "deepsea-nfs-runner-error",
      "122": "deepsea-nfs-no-hosts",
      "123": "deepsea-nfs-no-fsals",
      "131": "openattic-nfs-no-cephfs",
      "132": "openattic-nfs-no-rgw"
    };

    self.getErrorTemplate = function (reason) {
      if (angular.isDefined(reasons[reason])) {
        return "components/shared/oa-module-loader/reason-" + reason + "-" + reasons[reason] + ".html";
      }
      return "components/shared/oa-module-loader/reason-default.html";
    };

  }
});
