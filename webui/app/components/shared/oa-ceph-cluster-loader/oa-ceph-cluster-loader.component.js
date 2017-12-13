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

class OaCephClusterLoader {
  constructor ($state, cephClusterService, registryService) {
    this.$state = $state;
    this.cephClusterService = cephClusterService;
    this.registryService = registryService;

    this.loading = false;
    this.registry = registryService;
    this.cluster = undefined;
  }

  $onInit () {
    this.loadCluster();
  }

  loadCluster () {
    this.loading = true;
    this.cephClusterService.get().$promise
      .then((res) => {
        this.cluster = res;
        // Update the registry. Select the first cluster in the list
        // if there isn't already a cluster selected.
        if (_.isObjectLike(this.cluster) && this.cluster.results &&
          this.cluster.results.length > 0 &&
          _.isUndefined(this.registry.selectedCluster)) {
          this.registry.selectedCluster = this.cluster.results[0];
        }
        // Execute the callback function.
        if (_.isFunction(this.onClusterLoad)) {
          this.onClusterLoad({cluster: this.cluster});
        }
      }).finally(() => {
        this.loading = false;
      });
  }

  onClusterChange () {
  // Reload the current state to apply the newly selected cluster.
    this.$state.reload();
  }
}

export default {
  template: require("./oa-ceph-cluster-loader.component.html"),
  bindings: {
    onClusterLoad: "&"
  },
  transclude: true,
  controller: OaCephClusterLoader
};
