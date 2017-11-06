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

export default ($stateProvider) => {
  $stateProvider
    .state("cephPools", {
      url          : "/ceph/pools",
      views        : {
        "main": {
          component: "cephPoolsList"
        }
      },
      ncyBreadcrumb: {
        label: "Ceph Pools"
      }
    })
    .state("ceph-pools-add", {
      url: "/ceph/pools/add",
      views: {
        "main": {
          component: "cephPoolsAdd"
        }
      },
      params: {
        fsid: null
      },
      ncyBreadcrumb: {
        parent: "cephPools",
        label: "Add"
      }
    })
    .state("ceph-pools-edit", {
      url: "/ceph/pools/edit/:fsid/:poolId",
      views: {
        "main": {
          component : "cephPoolsAdd"
        }
      },
      ncyBreadcrumb: {
        label: "Edit {{pool.name}}",
        parent: "cephPools"
      }
    })
    .state("cephPools.detail", {
      views: {
        "tab": {
          component: "oaTabSet"
        }
      },
      ncyBreadcrumb: {
        skip: true
      }
    })
    .state("cephPools.detail.cacheTier", {
      url          : "/cachetier",
      views        : {
        "tab-content": {
          template: require("./ceph-pools-cache/ceph-pools-cache.component.html")
        }
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} cache tier"
      }
    })
    .state("cephPools.detail.statistics", {
      url          : "/statistics",
      views        : {
        "tab-content": {
          template: require("./ceph-pools-statistics/ceph-pools-statistics.component.html")
        }
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} statistics"
      }
    })
    .state("cephPools.detail.details", {
      url          : "/details",
      views        : {
        "tab-content": {template: require("./ceph-pools-detail/ceph-pools-detail.component.html")}
      },
      ncyBreadcrumb: {
        label: "{{selection.item.name}} details"
      }
    });
};
